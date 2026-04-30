import { PieceType, PieceShape } from "../types/game_types.js";

export class Piece{
    
    private type:PieceType;
    private x_pos:number;
    private y_pos:number;
    private shape:PieceShape;
    private rotation:number;
}