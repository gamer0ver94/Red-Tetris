import { PieceType, PieceShape, pieceShapes } from "../types/game_types.js";

export class Piece{
    
    private type:PieceType;
    private x_pos:number;
    private y_pos:number;
    private shape:PieceShape;
    private rotation:number;

    constructor(type:PieceType, x_pos=15, y_pos=0){
        this.type = type;
        this.x_pos = x_pos;
        this.y_pos = y_pos;
        this.shape = pieceShapes[type];
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

    public get_shape(){
        return this.shape
    }

    public get_rotation(){
        return this.rotation
    }


    public set_x(new_x:number){
        this.x_pos = new_x;
    }

    public set_y(new_y:number){
        this.y_pos = new_y;
    }

    public move_by(new_x:number, new_y:number){
        this.x_pos += new_x;
        this.y_pos += new_y;
    }

    public get_cells(){
        
        const cells : {x:number; y:number; type:PieceType}[] = [];
        
        for(let y = 0; y < this.shape.length; y ++){
            for (let x = 0; x < this.shape[y].length; x ++){
                if (this.shape[y][x] !== '.'){
                    cells.push({
                        x: this.x_pos + x,
                        y: this.y_pos + y,
                        type:this.type
                    });
                }
            }
        }
        return cells;
    }
}