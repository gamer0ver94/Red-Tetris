import { Board } from "./board_model.ts";
import { PieceType } from "../types/game_types.ts";
import { GameOptions } from "../types/game_options_types.ts";
import { ConfigProvider } from "./config_provider_model.js";
import { PlayerInGame } from "./player_in_game_model.ts";
import { PieceProvider } from "./piece_provider_model.ts";
import { ModelResult, CodeType } from "../types/error_code_types.js";

export class ActiveGame{
    private lobby_id:string;
    private players: Map<string, PlayerInGame>;
    private config: ConfigProvider;
    piece_provider:PieceProvider;
    private started_at:number

    constructor(
        lobby_id:string,
        game_opts:GameOptions,
        players_ids:string[],
    ){
        this.lobby_id = lobby_id;
        this.players = new Map<string, PlayerInGame>;
        this.config = new ConfigProvider(game_opts);
        const random = this.config.is_random_sequence();
        const shared = this.config.is_shared_sequence();
        this.piece_provider = new PieceProvider(players_ids, random, shared);
        this.started_at = Date.now()

    }

    //Getters
    public get_lobby_id():string{
        return this.lobby_id;
    }

    public get_players():PlayerInGame[]{
        return [... this.players.values()];
    }

    public get_players_ids():string[]{
        return [... this.players.keys()];
    }

    public get_player(player_id:string):ModelResult<PlayerInGame, CodeType>{
        if(! this.has_player(player_id))
            return {success:false, code:'PLAYER_NOT_FOUND'};
        return {success:true, data:this.players.get(player_id)!};
    }

    public get_opponents_of(player_id: string): PlayerInGame[] {
        return this.get_players().filter((player) => player.get_player_id() !== player_id);
    }

    public get_config(){
        return this.config;
    }

    public get_start_time(){
        return this.started_at;
    }



    //Setters
    public add_player(player_id:string, player_game:PlayerInGame):ModelResult<null, CodeType>{
        if(this.has_player(player_id))
            return {success:false, code:'PLAYER_IN_ACTIVE_GAME'};
        this.players.set(player_id, player_game);
        return {success:true, data:null };
    }

    public remove_player(player_id:string):ModelResult<null, CodeType>{

        if( ! this.has_player(player_id))
            return {success:false, code:'PLAYER_NOT_FOUND'};
        this.players.delete(player_id);
        return {success:true, data:null};
    }

    //Methods
    public has_player(player_id:string):boolean{
        
        const p = this.players.get(player_id)
        if(p)
            return true;
        return false;
    }

    public get_next_piece_for_player(player_id:string):ModelResult<PieceType, CodeType>{
        return this.piece_provider.get_next_piece_for_player(player_id);
    }

    public peek_pieces_for_player(player_id:string):ModelResult<PieceType[], CodeType>{
        return this.piece_provider.peek_for_player(
            player_id,
            this.config.get_preview_count()
        );
    }
}