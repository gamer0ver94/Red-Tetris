import { BoardCell, BoardType } from "../types/game_types.ts";
import { dropAction, moveAction } from "../types/socket_event_types.js";
import { Piece } from "./piece_model.ts";

export class Board {
    
    private grid:BoardType;
    private current_piece: Piece| null;

    constructor(width:number=20, heigth:number=30){
        this.grid = Array.from({length:heigth}, () =>
            Array.from({length:width}, () => '.'),);
        this.current_piece = null
    }

    public get_board(){
        return this.grid;
    }

    public get_current_piece(){
        return this.current_piece;
    }

    public set_current_piece(new_piece:Piece){
        this.current_piece = new_piece;
    }

    public can_place(piece:Piece, dx=0, dy=0){
      
        for(const cell of piece.get_cells()){
            const x = cell.x + dx;
            const y = cell.y + dy;

            if(x < 0 || x >= this.grid[0].length)
                return false;
            if(y < 0 || y >= this.grid.length)
                return false;
            if(this.grid[y][x] !== '.')
                return false;
        }
        return true;
    }

    public move_current_piece(dx:number){
        if(!this.current_piece)
            return false;
        if(!this.can_place(this.current_piece, dx, 0))
            return false;
        this.current_piece.move_by(dx, 0);
        return true;
    }

    public tick_down(dy = 1){
        if(!this.current_piece)
            return false;
        if (this.can_place(this.current_piece, 0, dy)){
            this.current_piece.move_by(0, dy);
            return true;
        }
        this.lock_current_piece();
        return false;
    }

    public lock_current_piece(){
        if(!this.current_piece)
            return false;
        for(const cell of this.current_piece.get_cells())
            this.grid[cell.y][cell.x] = cell.type;

        this.current_piece = null;
    }
}