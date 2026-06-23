import { BoardType, BoardCell } from "../types/game_types.js";
import { clone_board } from "./board.js";
import { is_piece_cell } from "./piece.js";


export function is_empty_cell(cell:BoardCell):boolean{
    return cell === '.' || cell == 'H'
}

export function apply_gravity_cell(board:BoardType):BoardType{

    const next_board = clone_board(board);

    for(let y = next_board.length - 2; y >= 0; y --){
        for(let x= 0; x < next_board[y].length; x ++){
            
            const cell = next_board[y][x];
            if(!is_piece_cell(cell))
                continue;
            let target_y = y;
            while(target_y + 1 < next_board.length &&
                is_empty_cell(next_board[target_y + 1][x]))
                    target_y += 1;
            
            if(target_y == y)
                continue;
            next_board[target_y][x] = cell;
            next_board[y][x] = ".";
        }
    }
    return next_board;
}