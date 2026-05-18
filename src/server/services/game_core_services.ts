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

export function  soft_drop(board){}

export function  hard_drop(board){}

export function  tick_board(
    board:Board,
    player_id:string,
    active_game:ActiveGame):
    ModelResult<null, CodeType>{
    
        if(!board.get_current_piece()){
            const next_piece_res = active_game.get_next_piece_for_player(player_id);
            if(!next_piece_res.success)
                return next_piece_res

            const spwan_res = spawn_piece(board, new Piece(next_piece_res.data));
            if(!spwan_res.success){
                const player_res = active_game.get_player(player_id);
                if(player_res.success)
                    player_res.data.mark_lost();

                return spwan_res;
            }
            return {success:true, data:null};
        }
        board.tick_down();
        return { success:true, data:null};
}

export function  spawn_piece(board:Board, piece:Piece):ModelResult<null, CodeType>{

    if(!board.can_place(piece))
        return {success:false, code:'PIECE_CANNOT_SPAWN'};
    board.set_current_piece(piece);
    return {success:true, data:null};
}

export function  clear_full_rows(board){}

export function  add_garbage_rows(board, count){}
