import { GameStatus, gameStatusType } from "../types/status_types.ts";
import { Board } from "./board_model.ts";

export class Game{

    private game_id: string;
    private owner_id: string;
    private player_ids: Set<string>;
    private game_type: 'single_player'| 'multi_player';
    private game_mode: string;
    private game_status: GameStatus;
    private ids_to_boards: Map<string, Board>;

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


    //Setters
    public set_game_status(game_status: GameStatus) {
        this.game_status = game_status
    }

    public set_owner(new_owner: string){
        this.owner_id = new_owner
    }

    public add_player(new_player: string){
        this.player_ids.add(new_player)
    }

    public remove_player(player: string){
        this.player_ids.delete(player)
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
}