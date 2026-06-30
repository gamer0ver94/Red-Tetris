import { BoardType, BoardCell, PieceState, RotationType, MovePieceResult} from "../types/game_types.js";
import { get_piece_cells, move_piece } from "./piece.js";


export function create_empty_board(width = 10, height = 20): BoardType {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "." as BoardCell),
  );
}

export function clone_board(current_board:BoardType):BoardType{

    return current_board.map((cell) => [...cell])
}

export function can_place_piece(
    board:BoardType,
    piece:PieceState,
    d_x = 0,
    d_y = 0,
    rotation:RotationType = piece.rotation
):boolean{
    const target_piece: PieceState = {
        ...piece,
        x:piece.x + d_x,
        y:piece.y + d_y,
        rotation
    };

    for (const cell of get_piece_cells(target_piece)){
        
        if(cell.x < 0 || cell.x >= board[0].length)
            return false;

        if(cell.y < 0 || cell.y >= board.length)
            return false;

        if(board[cell.y][cell.x] !== '.' && board[cell.y][cell.x] !== 'H')
            return false
    }
    return true;
}

export function place_piece(
    board:BoardType,
    piece:PieceState,
):BoardType{
    const next_board = clone_board(board);

    for(const cell of get_piece_cells(piece))
        next_board[cell.y][cell.x] = cell.type;
    return next_board;
}

export function move_if_valid(
    board:BoardType,
    piece:PieceState,
    d_x:number,
    d_y:number,
):MovePieceResult{

    if(!can_place_piece(board, piece,  d_x, d_y))
        return{moved:false}
    return{
        moved:true,
        piece:move_piece(piece, d_x, d_y),
    }
}

