import { BoardCell, BoardType, ClearedRowsResult } from "../types/game_types.ts";
import { Piece } from "./piece_model.ts";
import {
    can_place_piece,
    create_empty_board,
    move_if_valid,
    place_piece,
} from "../core/board.js";
import { apply_gravity_cell } from "../core/gravity.js";
import { clear_lines, get_full_lines_indexes } from "../core/line_clear.js";
import { is_piece_cell } from "../core/piece.js";

export class Board {
    
    private grid:BoardType;
    private current_piece: Piece| null;

    constructor(width:number=10, heigth:number=20){
        this.grid = create_empty_board(width, heigth);
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

    public set_board(board:BoardType){
        this.grid = board.map((row) => [...row]);
    }

    public can_place(piece:Piece, dx=0, dy=0, rotation = piece.get_rotation()){
        return can_place_piece(this.grid, piece.to_state(), dx, dy, rotation);
    }

    public move_current_piece(dx:number){
        if(!this.current_piece)
            return false;

        const move_res = move_if_valid(this.grid, this.current_piece.to_state(), dx, 0);
        if(!move_res.moved)
            return false;

        this.current_piece.apply_state(move_res.piece);
        return true;
    }

    public tick_down(dy = 1):'moved'|'locked'| 'no_piece'{
        if(!this.current_piece)
            return 'no_piece';

        const move_res = move_if_valid(this.grid, this.current_piece.to_state(), 0, dy);
        if (move_res.moved){
            this.current_piece.apply_state(move_res.piece);
            return 'moved';
        }

        this.lock_current_piece();
        return 'locked';
    }

    public lock_current_piece(){
        if(!this.current_piece)
            return false;

        this.grid = place_piece(this.grid, this.current_piece.to_state());
        this.current_piece = null;
    }

    public clear_full_rows(): ClearedRowsResult{
        const line_indexes = get_full_lines_indexes(this.grid);
        const clear_res = clear_lines(this.grid, line_indexes);
        this.grid = clear_res.board;
        return {
            cleared_lines: clear_res.cleared_lines,
            cleared_garbage: clear_res.cleared_garbage,
        };
    }

    public apply_cell_gravity_loop():ClearedRowsResult{
        
        const total: ClearedRowsResult = {
            cleared_lines: 0,
            cleared_garbage: 0,
        };

        while(true){
            const line_indexes = get_full_lines_indexes(this.grid);
            const clear = clear_lines(this.grid, line_indexes);
            if(clear.cleared_indexes.length == 0)
                break;

            this.grid = clear.board;
            total.cleared_lines += clear.cleared_lines;
            total.cleared_garbage += clear.cleared_garbage;

            this.grid = apply_gravity_cell(this.grid);
        }

        return total;
    }

    public apply_cell_gravity():boolean{
        const next_grid = apply_gravity_cell(this.grid);
        const moved = !are_boards_equal(this.grid, next_grid);
        this.grid = next_grid;
        return moved;
    }

    public is_piece_cell(cell:BoardCell):boolean{
        return is_piece_cell(cell);
    }
}

function are_boards_equal(left:BoardType, right:BoardType):boolean{
    if(left.length !== right.length)
        return false;

    for(let y = 0; y < left.length; y ++){
        if(left[y].length !== right[y].length)
            return false;

        for(let x = 0; x < left[y].length; x ++){
            if(left[y][x] !== right[y][x])
                return false;
        }
    }

    return true;
}
