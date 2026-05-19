import { PieceType, PieceShape, pieceShapes, BoardType } from "../types/game_types.js";

export class Piece{
    
    private type:PieceType;
    private x_pos:number;
    private y_pos:number;
    private shape:PieceShape;
    private rotation:number;

    constructor(type:PieceType, x_pos=5, y_pos=0){
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

    public get_rotation(){
        return this.rotation
    }

    public get_next_rotation():number{
        return (this.rotation + 1) % 4;
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

    public add_rotation(){
        this.rotation =(this.rotation + 1 ) % 4;
    }

    public get_cells(rotation=this.rotation){
        
        const cells : {x:number; y:number; type:PieceType}[] = [];
        const shape = this.get_shape(rotation);
        
        for(let y = 0; y < shape.length; y ++){
            for (let x = 0; x < shape[y].length; x ++){
                if (shape[y][x] !== '.'){
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

    public get_shape(rotation = this.rotation):PieceShape{
        
        let shape = this.shape;
        for(let i = 0; i < rotation; i++)
            shape = this.rotate_shape_clockwise(shape);

        return shape
    }

    private rotate_shape_clockwise(shape: PieceShape): PieceShape {
    return shape[0].map((_, x) =>
        shape.map((row) => row[x]).reverse()
    ) as PieceShape;
}

}