import { BoardCell, BoardType } from '../types/game_types.js'
import { clone_board } from './board.js';

export function resolve_garbage_to_send(
    clear:number,
    ratio:number
):number{

    if(clear <= 0)
        return 0;
    return Math.max(0, Math.floor(clear - ratio));
}

export function resolve_garbage_send_back(
    cleared_garbage:number,
    ratio:number,
    clear_create_garbage:boolean
):number{
    if(!clear_create_garbage || cleared_garbage <= 0)
        return 0;
    return Math.max(0, Math.floor(cleared_garbage - ratio));
}

export function create_garbage_row(width:number, hole_pos:number|null):BoardCell[]{
    return Array.from(
        {length:width},
        (_, x) => hole_pos !== null && x === hole_pos ? '.' : 'X',
    ) as BoardCell[]
}

export function add_garbage_rows(
    board:BoardType,
    rows:number,
    can_clear:boolean,
    random_int?: (max:number) => number,
):BoardType{

    if(rows <= 0 || board.length === 0 || board[0].length === 0)
        return clone_board(board);

    const width = board[0].length;
    const get_random_int = random_int ?? ((max:number) => Math.floor(Math.random() * max));
    const hole_pos = can_clear ? get_random_int(width) : null;

    const next_board = clone_board(board);
    for(let i = 0; i < rows; i ++){
        next_board.shift();
        next_board.push(create_garbage_row(width, hole_pos));
    }
    return next_board;
}