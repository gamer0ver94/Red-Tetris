import { BoardType, PieceCell, PieceState, PieceType, RotationType } from "../types/game_types.js";
import {
    create_piece_state,
    get_piece_cells,
    move_piece,
    rotate_piece,
} from "../core/piece.js";
import { get_next_rotation, get_shape } from "../core/rotation.js";

export class Piece{
    
    private type:PieceType;
    private x_pos:number;
    private y_pos:number;
    private rotation:RotationType;

    constructor(type:PieceType, x_pos=3, y_pos=0){
        this.type = type;
        this.x_pos = x_pos;
        this.y_pos = y_pos;
        this.rotation = 0;
    }

    public get_type(){
        return this.type;
    }

    public get_x(){
        return this.x_pos
    }

    public get_y(){
        return this.y_pos
    }

    public get_rotation(){
        return this.rotation
    }

    public get_next_rotation():RotationType{
        return get_next_rotation(this.rotation);
    }

    public to_state():PieceState{
        return create_piece_state(this.type, this.x_pos, this.y_pos, this.rotation);
    }

    public apply_state(piece:PieceState){
        this.type = piece.type;
        this.x_pos = piece.x;
        this.y_pos = piece.y;
        this.rotation = piece.rotation;
    }

    public set_x(new_x:number){
        this.x_pos = new_x;
    }

    public set_y(new_y:number){
        this.y_pos = new_y;
    }

    public move_by(new_x:number, new_y:number){
        this.apply_state(move_piece(this.to_state(), new_x, new_y));
    }

    public add_rotation(){
        this.apply_state(rotate_piece(this.to_state()));
    }

    public get_cells(rotation=this.rotation):PieceCell[]{
        return get_piece_cells(this.to_state(), rotation);
    }

    public get_shape(rotation = this.rotation):BoardType{
        return get_shape(this.type, rotation);
    }

}
