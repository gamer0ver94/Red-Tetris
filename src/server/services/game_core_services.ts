//hanldes pure game logic
import { Board } from "../models/board_model.ts";
import { Piece } from "../models/piece_model.ts";
import { CodeType, ModelResult } from "../types/error_code_types.js";
import { ActiveGame } from "../models/active_game_model.js";
import { RotationProvider } from "../models/rotation_provider_model.js";
import { PlayerInGame } from "../models/player_in_game_model.js";
import { ScoreProvider } from "../models/score_provider.js";
import {resolve_garbage_to_send, resolve_garbage_send_back, spawn_garbage} from "./garbage_services.js";


export function move_left(active_game:ActiveGame, player_id:string){
    const context = resolve_context_from_id(active_game, player_id);
    if(context?.board && context.current_piece){
        if(context.board.can_place(context.current_piece, -1, 0)){
            context.current_piece.move_by(-1, 0);
            context.player_in_game.try_reset_lock_delay(
                active_game.get_config().get_max_lock()
            );
        }
    }
}

export function move_right(active_game:ActiveGame, player_id:string){
    const context = resolve_context_from_id(active_game, player_id);
    if(context?.board && context.current_piece){
        if(context.board.can_place(context.current_piece, 1, 0)){
            context.current_piece.move_by(1, 0);
            context.player_in_game.try_reset_lock_delay(
                active_game.get_config().get_max_lock()
            );
        }
    }
}

export function  tick_board(
    board:Board,
    player_id:string,
    active_game:ActiveGame,
    now = Date.now(),
    apply_gravity = true):
    ModelResult<{clear:number, lock_waiting:boolean}, CodeType>{
        
        const player_res = active_game.get_player(player_id);
        if(!player_res.success)
            return player_res;
        const player = player_res.data

        if(!board.get_current_piece()){
            player.clear_lock_delay();
            player.set_hold_false();
            const next_piece_res = active_game.get_next_piece_for_player(player_id);
            if(!next_piece_res.success)
                return next_piece_res

            const spwan_res = spawn_piece(board, new Piece(next_piece_res.data));
            if(!spwan_res.success){
                player.mark_lost();
                return spwan_res;
            }
            player.clear_lock_delay();
            return {success:true, data:{clear:0, lock_waiting:false}};
        }
        const current_piece = board.get_current_piece()!;
        let clear = 0

        if(board.can_place(current_piece, 0, 1)){
            player.clear_lock_delay();
            if(apply_gravity)
                current_piece.move_by(0, 1);
            return { success:true, data: {clear:0, lock_waiting:false}};
        }

        player.start_lock_delay(now);
        const touching_ground_since = player.get_touching_ground_since()!;
        if(now - touching_ground_since < active_game.get_config().get_lock_delay_ms())
            return { success:true, data: {clear:0, lock_waiting:true}};

        board.lock_current_piece();
        clear = finish_piece_lock(board, active_game, player);
        if(clear == 0)
            player.reset_bonus();
        if(clear > 0 && active_game.get_config().is_back_to_back_enable())
            player.increase_bonus();
        return { success:true, data: {clear, lock_waiting:false}};
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
        player_in_game.clear_lock_delay();
        return {success:true, data:null};
    }
    player_in_game.get_board().set_current_piece(new Piece(new_curr));
    player_in_game.clear_lock_delay();
    return {success:true, data:null};
}


export function rotate(active_game:ActiveGame, player_id:string){
    const context = resolve_context_from_id(active_game, player_id);
    if(context?.board && context.current_piece){
        const from = context.current_piece.get_rotation();
        const to = context.current_piece.get_next_rotation();
        const kicks = RotationProvider.get_kicks(context.current_piece.get_type(), from, to);

        for (const [dx, dy] of kicks) {
            if(!context.board.can_place(context.current_piece, dx, dy, to))
                continue;
            context.current_piece.move_by(dx, dy);
            context.current_piece.add_rotation();
            context.player_in_game.try_reset_lock_delay(
                active_game.get_config().get_max_lock()
            );
            return;
        }
    }
}

function finish_piece_lock(board:Board, active_game:ActiveGame, player:PlayerInGame){
    
    player.clear_lock_delay();
    
    const clear_res = active_game.get_config().get_line_clear_mode() == 'cell_gravity'
        ? board.apply_cell_gravity_loop()
        : board.clear_full_rows();

    const clear = clear_res.cleared_lines;
    const cleared_garbage = clear_res.cleared_garbage;

    if(clear > 0 && active_game.get_config().is_invisible())
        player.reveal_grid_for(active_game.get_config().get_reveal_on_clear_ms());
 
    player.add_lines(clear);
    

    let score = player.get_score();
    score = ScoreProvider.line_clear(score, clear, player.get_bonus());
    score = ScoreProvider.garbage_clear(score, cleared_garbage, player.get_bonus());
    player.set_score(score);
    
    if(!active_game.get_config().is_garbage_enabled())
        return clear;

    let garbage_to_send = resolve_garbage_to_send(clear, active_game.get_config().get_garbage_ratio());

    garbage_to_send += resolve_garbage_send_back(cleared_garbage, active_game.get_config().is_clear_create_garbage_enabled());

    if(garbage_to_send <= 0)
        return clear;

    const opponents = active_game.get_opponents_of(player.get_player_id()).filter((opponent) => opponent.is_alive());
    if(opponents.length == 0)
        return clear;

    const opponents_boards = Object.fromEntries(
        opponents.map((opponent) => [
            opponent.get_player_id(),
            opponent.get_board().get_board(),
        ]),
    );

    const received = spawn_garbage(
        opponents_boards,
        garbage_to_send,
        active_game.get_config().can_spawn_clearable_garbage(),
    );

    if (active_game.get_config().is_score_enable()) {
        for (const opponent of opponents) {
            const received_rows = received[opponent.get_player_id()] ?? 0;
            if (received_rows <= 0)
                continue;

            opponent.set_score(
                ScoreProvider.garbage_spawn(opponent.get_score(), received_rows),
            );
        }
    }

    return clear;
}

function resolve_context_from_id(active_game:ActiveGame, player_id:string){

    const player_res = active_game.get_player(player_id)
    if(!player_res.success)
        return;
    const board = player_res.data.get_board();
    const current_piece = board.get_current_piece();
    return { player_in_game:player_res.data, board, current_piece};
}
