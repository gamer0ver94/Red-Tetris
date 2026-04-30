//hanldes pure game logic
import { Board } from "../models/board_model.ts";
import { Piece } from "../models/piece_model.ts";
import { Game } from "../models/game_model.ts";


export function move_piece_left(board){}

export function move_piece_right(board){}

export function  soft_drop(board){}

export function  hard_drop(board){}

export function  tick_board(board:Board, player_id:string, game:Game){
    const player_ids = game.get_board_map().keys()
    if (!board.get_current_piece()){
        const next = new Piece(game.get_next_piece(player_id));
        const res = spawn_piece(board, next);
        if(!res.success)
            return{success:false, reason:'you lost'};
    }
    else
        board.tick_down();
    return{success:true};
}

export function  spawn_piece(board:Board, piece:Piece){

    if(!board.can_place(piece))
        return {success:false, reason:"Piece cannot spawn"};
    board.set_current_piece(piece);
    return {success:true};
}

export function  clear_full_rows(board){}

export function  add_garbage_rows(board, count){}
