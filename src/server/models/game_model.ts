import { pieceType, PieceType } from "../types/game_types.js";
import { GameStatus, gameStatusType } from "../types/status_types.ts";
import { Board } from "./board_model.ts";

const PIECES= Object.values(pieceType) as PieceType[];

function resolve_sequence() : PieceType[]{
    const bag = [...PIECES];

    for(let i = bag.length - 1; i > 0; i--){
        const j = Math.floor(Math.random()* (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
}

export class Game{

    private game_id: string;
    private owner_id: string;
    private player_ids: Set<string>;
    private game_type: 'single_player'| 'multi_player';
    private game_mode: string;
    private game_status: GameStatus;
    private ids_to_boards: Map<string, Board>;
    private piece_sequence: PieceType[];
    private player_to_piece_map: Map<string, number>;

    constructor(
        game_id: string,
        owner_id: string,
        game_type: 'single_player' | 'multi_player',
        game_mode: string, //ADD VARIOUS MODE HERE
    ){
        this.game_id = game_id;
        this.owner_id = owner_id;
        this.player_ids = new Set<string>();
        this.player_ids.add(owner_id);
        this.game_type = game_type;
        this.game_mode = game_mode;
        this.game_status = gameStatusType.created;
        this.ids_to_boards = new Map<string, Board>();
        this.player_to_piece_map = new Map<string, number>();
        this.piece_sequence = resolve_sequence();
    }

    // Getters
    public get_game_id(): string{
        return this.game_id
    }
    
    public get_owner_id(): string {
        return this.owner_id
    }

    public get_player_ids(): Set<string> {
        return this.player_ids!
    }

    public get_game_type(): string {
        return this.game_type
    }

    public get_game_mode(): string {
        return this.game_mode
    }

    public get_game_status(): GameStatus {
        return this.game_status
    }

    public get_board_map(): Map<string, Board>{
        return this.ids_to_boards;
    }

    public get_board_by_player_id(player_id:string){
        return this.ids_to_boards.get(player_id);
    }

    public get_player_to_piece_map():Map<string, number>{
        return this.player_to_piece_map;
    }

    public get_piece_sequence():PieceType[]{
        return this.piece_sequence;
    }

    //Setters
    public set_game_status(game_status: GameStatus) {
        this.game_status = game_status;
    }

    public set_owner(new_owner: string){
        this.owner_id = new_owner;
    }

    public add_player(new_player: string){
        this.player_ids.add(new_player);
    }

    public remove_player(player: string){
        this.player_ids.delete(player);
    }

    public set_new_board(player_id:string, board:Board):boolean{
        
        const check = this.ids_to_boards.get(player_id);
        if (check)
            return false;
        this.ids_to_boards.set(player_id, board);
        return true;
    }

    public remove_board(player_id:string):boolean{
        
        const check = this.ids_to_boards.get(player_id);
        if(check){
            this.ids_to_boards.delete(player_id);
            return true;
        }
        return false;
    }

    public set_player_piece_map(player_id:string){
        this.player_to_piece_map.set(player_id, 0);
    }

    public get_next_piece(player_id:string):PieceType{

        let current_index = this.player_to_piece_map.get(player_id)!;
        const piece = this.piece_sequence[current_index];
        current_index += 1;
        if(current_index >= this.piece_sequence.length)
            current_index = 0;
        this.player_to_piece_map.set(player_id, current_index);
        return piece;
    }

    public remove_player_to_piece(player_id:string){
        this.player_to_piece_map.delete(player_id);
    }
}