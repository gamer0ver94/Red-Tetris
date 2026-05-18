import { PieceType } from "../types/game_types.js";
import { Board } from "./board_model.js";

export class PlayerInGame{

    private player_id:string;
    private board:Board;
    private hold_piece:PieceType|null;
    private score:number;
    private lines:number;
    private alive:boolean;

    constructor(
        board:Board,
        player_id:string
    ){
        this.player_id = player_id;
        this.board = board;
        this.score = 0;
        this.lines = 0;
        this.hold_piece = null
        this.alive = true;
    }

    //Getters
    public get_board():Board{
        return this.board;
    }

    public get_score():number{
        return this.score;
    }

    public get_lines():number{
        return this.lines;
    }

    public is_alive():boolean{
        return this.alive;
    }

    public get_player_id():string{
        return this.player_id;
    }

    public get_hold_piece():PieceType|null{
        return this.hold_piece;
    }

    //Setters
    public set_hold_piece(piece:PieceType){
        this.hold_piece = piece;
    }
    public add_lines(lines:number){
        this.lines += lines;
    }

    public add_score(points:number){
        this.score += points;
    }

    public mark_lost(){
        this.alive = false;
    }
}