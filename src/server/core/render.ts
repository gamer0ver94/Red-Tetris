import { BoardCell, BoardType, PieceState } from "../types/game_types.js";
import { can_place_piece, clone_board } from "./board.js";
import { get_piece_cells, move_piece } from "./piece.js";

export function build_visible_board(
    current_piece:PieceState|null,
    board:BoardType,
    cur_piece_visible:boolean,
    highlight_lock_on:boolean,
):BoardType{
    let visible = clone_board(board);
    visible = overlay_render_pieces(
        visible,
        board,
        current_piece,
        cur_piece_visible,
        highlight_lock_on,
    );
    return visible;
}


export function build_empty_board(
    current_piece:PieceState|null,
    board:BoardType,
    cur_piece_visible:boolean,
    highlight_lock_on:boolean,
):BoardType{

    let empty = board
        .map((row) => row
            .map(() => '.' as BoardCell)
        ) as BoardType;

    empty = overlay_render_pieces(
        empty,
        board,
        current_piece,
        cur_piece_visible,
        highlight_lock_on,
    );
    return empty;
}

export function build_highest_board(
    current_piece:PieceState|null,
    board:BoardType,
    cur_piece_visible:boolean,
    highlight_lock_on:boolean,   
):BoardType{

    let highest = build_empty_board(
        current_piece,
        board,
        false,
        false,
    );
    for(let x = 0; x < board[0].length; x++){
        for (let y = 0; y < board.length; y++){
            if(board[y][x] !== '.' && board[y][x] !== 'H'){
                for(let fill_y = y; fill_y < board.length; fill_y ++)
                    highest[fill_y][x] = 'X';
                break;
            }
        }
    }
    highest = overlay_render_pieces(
        highest,
        board,
        current_piece,
        cur_piece_visible,
        highlight_lock_on,
    );
    return highest;
}

function overlay_render_pieces(
    render_board:BoardType,
    source_board:BoardType,
    current_piece:PieceState|null,
    cur_piece_visible:boolean,
    highlight_lock_on:boolean,
):BoardType{
    let next_board = clone_board(render_board);

    if(highlight_lock_on && current_piece)
        next_board = overlay_piece(
            next_board,
            get_lock_piece(source_board, current_piece),
            'H',
        );

    if(cur_piece_visible && current_piece)
        next_board = overlay_piece(next_board, current_piece);

    return next_board;
}

function get_lock_piece(
    board:BoardType,
    piece:PieceState,
):PieceState{
    let lock_piece = piece;

    while(can_place_piece(board, lock_piece, 0, 1))
        lock_piece = move_piece(lock_piece, 0, 1);

    return lock_piece;
}

function overlay_piece(
    board:BoardType,
    piece:PieceState,
    marker?:BoardCell,
):BoardType{
    const new_board = clone_board(board);
    if(!marker)
        marker = piece.type;
    for(const cell of get_piece_cells(piece)){
        if(!is_inside_board(new_board, cell.x, cell.y))
            continue;
        new_board[cell.y][cell.x] = marker;
    }
    return new_board;
}

function is_inside_board(
    board:BoardType,
    piece_x:number,
    piece_y:number,
){
    return (
        piece_y >= 0 &&
        piece_y < board.length &&
        piece_x >= 0 &&
        piece_x < board[0].length
    );
}
