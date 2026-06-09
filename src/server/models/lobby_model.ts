import { GameOptions } from "../types/game_options_types.ts";
import { GameStatus, gameStatusType } from "../types/status_types.ts";

export class Lobby{
    private lobby_id: string;
    private owner_id: string;
    private player_ids: Set<string>;
    private game_opts:GameOptions;
    private game_status: GameStatus;
    private game_mode:string;

    constructor(
        lobby_id: string,
        owner_id: string,
        game_opts:GameOptions,
        game_mode:string,
    ){
        this.lobby_id = lobby_id;
        this.owner_id = owner_id;
        this.player_ids = new Set<string>();
        this.game_status = gameStatusType.created;
        this.game_opts = game_opts;
        this.game_mode = game_mode
    }

    // Getters
    public get_lobby_id(): string{
        return this.lobby_id
    }
    
    public get_owner_id(): string {
        return this.owner_id
    }

    public get_player_ids(): string[] {
        return [...this.player_ids]
    }

    public get_game_opts(): GameOptions {
        return this.game_opts
    }

    public get_game_status(): GameStatus {
        return this.game_status
    }

    public get_player_count():number{
        return this.player_ids.size;
    }

    public get_game_mode():string{
        return this.game_mode
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

    //Methods
    public has_player(player_id:string):boolean{
        if(this.player_ids.has(player_id))
            return true;
        return false;
    }

    public is_owner(player_id:string):boolean{
        return player_id === this.owner_id;
    }

    public can_join():boolean{

        if(this.game_status !== gameStatusType.waiting)
            return false;
        if(this.game_opts.multiplayer.maxPlayers === null)
            return true;
        return this.get_player_count() < this.game_opts.multiplayer.maxPlayers
    }
}