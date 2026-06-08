import { BoardCell, BoardType, ClearedRowsResult } from "../types/game_types.ts";
import { Piece } from "./piece_model.ts";

export class Board {
    
    private grid:BoardType;
    private current_piece: Piece| null;

    constructor(width:number=10, heigth:number=20){
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

    public can_place(piece:Piece, dx=0, dy=0, rotation = piece.get_rotation()){
      
        for(const cell of piece.get_cells(rotation)){
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

    public tick_down(dy = 1):'moved'|'locked'| 'no_piece'{
        if(!this.current_piece)
            return 'no_piece';
        if (this.can_place(this.current_piece, 0, dy)){
            this.current_piece.move_by(0, dy);
            return 'moved';
        }
        this.lock_current_piece();
        return 'locked';
    }

    public lock_current_piece(){
        if(!this.current_piece)
            return false;
        for(const cell of this.current_piece.get_cells())
            this.grid[cell.y][cell.x] = cell.type;

        this.current_piece = null;
    }

    public clear_full_rows(): ClearedRowsResult{
        const width = this.grid[0].length;
        let cleared_lines = 0;
        let cleared_garbage = 0;

        const remaining_rows = this.grid.filter((row) => {
            const is_full = row.every((cell) => cell !== '.');
            const has_piece_cell = row.some((cell) => this.is_piece_cell(cell));
            const should_clear = is_full && has_piece_cell;

            if(should_clear){
                cleared_lines += 1;
                if(row.includes('X'))
                    cleared_garbage += 1;
            }

            return !should_clear;
        });

            const empty_rows: BoardCell[][] = Array.from({ length: cleared_lines }, () =>
                Array.from({ length: width }, () => '.' as BoardCell)
            );

        this.grid = [...empty_rows, ...remaining_rows];
        return { cleared_lines, cleared_garbage };
    }

    public apply_cell_gravity_loop():ClearedRowsResult{
        
        const total: ClearedRowsResult = { cleared_lines: 0, cleared_garbage: 0 };
        while(true){
            const clear = this.clear_full_rows();
            if(clear.cleared_lines == 0)
                break;
            total.cleared_lines += clear.cleared_lines;
            total.cleared_garbage += clear.cleared_garbage;

            let moved = true;
            while (moved)
                moved = this.apply_cell_gravity();
        }
        return total;
    }

    public apply_cell_gravity():boolean{
        let moved = false;

        for (let y = this.grid.length - 2; y >= 0 ; y --){

            for (let x = 0; x < this.grid[y].length; x ++){
                const cell = this.grid[y][x];
                if(!this.is_piece_cell(cell))
                    continue;
                
                let target_y = y;

                while(target_y + 1 < this.grid.length && this.grid[target_y + 1][x] === '.')
                    target_y ++;

                if(target_y !== y){
                    this.grid[target_y][x] = cell;
                    this.grid[y][x]= '.';
                    moved = true;
                }
            }
        }
        return moved;
    }

    public is_piece_cell(cell:BoardCell):boolean{
        return cell !== '.' && cell !== 'X';
    }
}