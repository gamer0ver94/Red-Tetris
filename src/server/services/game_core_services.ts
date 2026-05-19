//hanldes pure game logic
import { Board } from "../models/board_model.ts";
import { Piece } from "../models/piece_model.ts";
import { CodeType, ModelResult } from "../types/error_code_types.js";
import { ActiveGame } from "../models/active_game_model.js";


export function move_piece_left(board:Board){
    const piece = board.get_current_piece();
    if(piece){
        if(board.can_place(piece,  -1, 0))
            piece.move_by(-1, 0);
    }
}

export function move_piece_right(board:Board){
    const piece = board.get_current_piece();
    if(piece){
        if(board.can_place(piece, 1, 0))
            piece.move_by(1, 0);
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
            if(active_game.get_game_opts().gravity.fallAfterClear)
                clear = board.apply_cell_gravity_loop();
            else
                clear = board.clear_full_rows();
            if(clear > 0 && active_game.get_game_opts().grid.invisible)
                player.reveal_grid_for(active_game.get_game_opts().grid.revealOnClearMs);

        }
        return { success:true, data: clear};
}

export function  spawn_piece(board:Board, piece:Piece):ModelResult<null, CodeType>{

    if(!board.can_place(piece))
        return {success:false, code:'PIECE_CANNOT_SPAWN'};
    board.set_current_piece(piece);
    return {success:true, data:null};
}


export function  add_garbage_rows(board, count){}
