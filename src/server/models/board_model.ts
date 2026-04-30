import { BoardType } from "../types/game_types.ts";
import { dropAction, moveAction } from "../types/socket_event_types.js";
import { Piece } from "./piece_model.ts";

export class Board {
    
    private grid:BoardType;
    private current_piece:Piece;

    public get_board(){
        return this.grid;
    }

    public get_current_piece(){
        return this.current_piece;
    }

    public set_current_piece(new_piece:Piece){
        this.current_piece = new_piece;
    }

    public move(action:moveAction){

    }

    public drop(action:dropAction){

    }

    public add_garbage_row(){

    }

    public check_full_row(){

    }

    public check_piece_collision(){

    }

    public check_lost(){

    }
}