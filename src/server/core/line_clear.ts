import {
    BoardCell,
    BoardType,
    ClearLinesResult,
} from "../types/game_types.js";
import { clone_board } from "./board.js";
import { is_piece_cell } from "./piece.js";


export function get_full_lines_indexes(board:BoardType):number[]{

    let indexes:number[] = [];

    for (let y = 0; y < board.length; y += 1){
        const row = board[y];
        //row contains no empty cell
        const is_full = row.every((cell) => cell !== '.' && cell !== 'H');
        //row contains at least one real cell (no garbage)
        const has_piece_cell = row.some((cell) => is_piece_cell(cell));

        if(is_full && has_piece_cell)
            indexes.push(y);
    }
    return indexes;
}

export function clear_lines(
    board:BoardType,
    line_indexes:number[],
    max = line_indexes.length
):ClearLinesResult{

    const selected_indexes = line_indexes.slice(-max);
    const indexes_to_clear = new Set(selected_indexes);

    if (selected_indexes.length === 0) {
        return {
            board: clone_board(board),
            cleared_lines: 0,
            cleared_garbage: 0,
            cleared_indexes:[],
        };
    }
    const width = board[0].length;
    let cleared_garbage = 0;
    let cleared_lines = 0;
    //Fliter only not full row
    const remaining_rows = board.
        filter((row, y) => {
            if(!indexes_to_clear.has(y))
                return true;
            row.includes("X") ? cleared_garbage += 1 : cleared_lines += 1;
            return false;
        }).map((row) => [...row]);
    //create empty rows to replace the erased one
    const empty_rows:BoardCell[][] = Array.from(
        {length:selected_indexes.length},
        () => Array.from({length:width}, () => '.' as BoardCell),
    );
    return {
        board:[...empty_rows, ...remaining_rows],
        cleared_lines,
        cleared_garbage,
        cleared_indexes:selected_indexes
    };
}
