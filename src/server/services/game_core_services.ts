//hanldes pure game logic
import { Board } from "../models/board_model.ts";
import { Piece } from "../models/piece_model.ts";
import { CodeType, ModelResult } from "../types/error_code_types.js";
import { ActiveGame } from "../models/active_game_model.js";


export function move_left(active_game:ActiveGame, player_id:string):ModelResult<null, CodeType>{
    const context = resolve_context_from_id(active_game, player_id);
    if(context?.board && context.current_piece){
        if(context.board.can_place(context.current_piece, -1, 0))
            context.current_piece.move_by(-1, 0);
    }
}

export function move_right(active_game:ActiveGame, player_id:string):ModelResult<null, CodeType>{
    const context = resolve_context_from_id(active_game, player_id);
    if(context?.board && context.current_piece){
        if(context.board.can_place(context.current_piece, -1, 0))
            context.current_piece.move_by(1, 0);
    }
}

export function  tick_board(
    board:Board,
    player_id:string,
    active_game:ActiveGame):
    ModelResult<number, CodeType>{
        
        const player_res = active_game.get_player(player_id);
        if(!player_res.success)
            return player_res;
        const player = player_res.data

        if(!board.get_current_piece()){
            player.set_hold_false();
            const next_piece_res = active_game.get_next_piece_for_player(player_id);
            if(!next_piece_res.success)
                return next_piece_res

            const spwan_res = spawn_piece(board, new Piece(next_piece_res.data));
            if(!spwan_res.success){
                player.mark_lost();
                return spwan_res;
            }
            return {success:true, data:0};
        }
        let clear = 0
        const res = board.tick_down();
        if(res === 'locked'){
            if(active_game.get_config().get_line_clear_mode() == 'cell_gravity')
                clear = board.apply_cell_gravity_loop();
            else
                clear = board.clear_full_rows();
            if(clear > 0 && active_game.get_config().is_invisible())
                player.reveal_grid_for(active_game.get_config().get_reveal_on_clear_ms());

        }
        return { success:true, data: clear};
}

export function  spawn_piece(board:Board, piece:Piece):ModelResult<null, CodeType>{

    if(!board.can_place(piece))
        return {success:false, code:'PIECE_CANNOT_SPAWN'};
    board.set_current_piece(piece);
    return {success:true, data:null};
}

export function hold(active_game:ActiveGame, player_id:string):ModelResult<null, CodeType>{

    //hold not allow
    if(!active_game.get_config().can_hold())
        return {success:false, code:'NOT_ALLOWED'};
    
    const player_in_game_res = active_game.get_player(player_id)
    if(!player_in_game_res.success)
        return player_in_game_res;
    const player_in_game = player_in_game_res.data;
    
    //already hold
    if(player_in_game.get_hold())
        return {success:false, code:'ONLY_HOLD_ONCE'};

    const current_piece = player_in_game.get_board().get_current_piece();
    //on the one frame with no current piece
    if(!current_piece)
        return {success:false, code:'PIECE_CANNOT_SPAWN'};
    const hold_piece = player_in_game.get_hold_piece();
    const new_curr = player_in_game.shift_hold_piece(current_piece.get_type());
    
    //first hold of the game
    if(!hold_piece){
        const next_piece_res = active_game.get_next_piece_for_player(player_id);
        if(!next_piece_res.success)
            return next_piece_res;
        player_in_game.get_board().set_current_piece(new Piece(next_piece_res.data));
        return {success:true, data:null};
    }
    player_in_game.get_board().set_current_piece(new Piece(new_curr));
    return {success:true, data:null};
}

function resolve_context_from_id(active_game:ActiveGame, player_id:string){

    const player_res = active_game.get_player(player_id)
    if(!player_res.success)
        return;
    const board = player_res.data.get_board();
    const current_piece = board.get_current_piece();
    return { player_in_game:player_res.data, board, current_piece};
}