import { 
    get_next_rotation,
    get_shape,
} from "./rotation.js";


import {
    BoardCell,
    PieceCell,
    PieceState,
    PieceType,
    RotationType,
} from "../types/game_types.js";

export function is_piece_cell(cell: BoardCell): boolean {
  return cell !== "." && cell !== "X" && cell !== 'H';
}



export function create_piece_state(
    type:PieceType,
    x = 3,
    y = 0,
    rotation:RotationType = 0,
):PieceState{
    return {type, x, y, rotation};
}

export function move_piece(
    piece:PieceState,
    d_x:number,
    d_y:number
){
    return {
        ...piece,
        x:piece.x+ d_x,
        y:piece.y + d_y,
    };
}

export function rotate_piece(
    piece:PieceState,
    rotation = get_next_rotation(piece.rotation),
):PieceState{
    return {
        ...piece,
        rotation,
    };
}



export function get_piece_cells(
    piece: PieceState,
    rotation = piece.rotation,
): PieceCell[] {
    const cells: PieceCell[] = [];
    const shape = get_shape(piece.type, rotation);

    for (let y = 0; y < shape.length; y += 1) {
        for (let x = 0; x < shape[y].length; x += 1) {
            if (shape[y][x] === ".")
                continue;

            cells.push({
                x: piece.x + x,
                y: piece.y + y,
                type: piece.type,
            });
        }
    }

    return cells;
}



