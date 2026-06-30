import {
    add_garbage_rows,
    resolve_garbage_send_back as resolve_garbage_send_back_core,
    resolve_garbage_to_send as resolve_garbage_to_send_core,
} from "../core/garbage.js";
import { BoardType } from "../types/game_types.js";

export function spawn_garbage(
    opponents_boards:Record<string,BoardType>,
    rows:number,
    can_clear:boolean,
):Record<string,number>{
    const received:Record<string,number> = {};

    if(rows <= 0)
        return received;

    for(const [player_id, board] of Object.entries(opponents_boards)){
        if(board.length === 0 || board[0].length === 0){
            received[player_id] = 0;
            continue;
        }

        const next_board = add_garbage_rows(board, rows, can_clear);
        board.splice(
            0,
            board.length,
            ...next_board.map((row) => [...row]),
        );
        received[player_id] = rows;
    }

    return received;
}

export function resolve_garbage_to_send(clear:number, ratio:number):number{
    return resolve_garbage_to_send_core(clear, ratio);
}

export function resolve_garbage_send_back(
    cleared_garbage:number,
    clear_create_garbage:boolean,
):number{
    return resolve_garbage_send_back_core(cleared_garbage, 0, clear_create_garbage);
}
