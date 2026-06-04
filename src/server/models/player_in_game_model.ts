import { Piece } from "./piece_model.js";
import { Board } from "./board_model.js";
import { PieceType } from "../types/game_types.js";

type PlayerGravityState = {
  last_fall_at: number;
  fall_every_ms: number;
  soft_drop: boolean;
  hard_drop:boolean;
};


export class PlayerInGame{

    private player_id:string;
    private board:Board;
    private hold_piece:PieceType|null;
    private score:number;
    private lines:number;
    private alive:boolean;
    private gravity_state:PlayerGravityState;
    private grid_visible_until:number|null;
    private has_hold:boolean;
    private touching_ground_since:number|null;
    private lock_reset_count:number;

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
        this.gravity_state = {
            last_fall_at: Date.now(),
            fall_every_ms:0,
            soft_drop:false,
            hard_drop:false,
        }
        this.grid_visible_until = null;
        this.has_hold = false;
        this.touching_ground_since = null;
        this.lock_reset_count = 0;
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

    public get_gravity():PlayerGravityState{
        return this.gravity_state;
    }

    public get_hold():boolean{
        return this.has_hold
    }

    public get_touching_ground_since():number|null{
        return this.touching_ground_since;
    }

    public is_lock_delay_active():boolean{
        return this.touching_ground_since !== null;
    }

    //Setters
    public set_hold_piece(piece:PieceType){
        this.hold_piece = piece;
    }

    public set_hold_false(){
        this.has_hold = false;
    }

    public start_lock_delay(now:number){
        if(this.touching_ground_since === null)
            this.touching_ground_since = now;
    }

    public reset_lock_delay(){
        this.touching_ground_since = null;
    }

    public clear_lock_delay(){
        this.touching_ground_since = null;
        this.lock_reset_count = 0;
    }

    public add_lines(lines:number){
        this.lines += lines;
    }

    public set_score(new_score:number){
        this.score = new_score;
    }

    public mark_lost(){
        this.alive = false;
    }

    public reveal_grid_for(ms:number){
        this.grid_visible_until = Date.now() + ms;
    }

    public is_grid_visible():boolean{
        if(this.grid_visible_until === null)
            return false
        return Date.now() < this.grid_visible_until;
    }

    public shift_hold_piece(current_piece:PieceType):PieceType{

        const tmp_piece = this.hold_piece!;
        this.hold_piece = current_piece;
        this.has_hold = true;
        return tmp_piece
    }

    public try_reset_lock_delay(max_try:number):boolean{
        
        if(this.touching_ground_since == null)
            return false;

        if(max_try !== 0 && this.lock_reset_count >= max_try)
            return false;
        this.touching_ground_since = null;
        this.lock_reset_count += 1;
        return true;
    }
}
