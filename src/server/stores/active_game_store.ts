import { ActiveGame } from "../models/active_game_model.ts";
import { PlayerInGame } from "../models/player_in_game_model.ts";
import { CodeType, ModelResult } from "../types/error_code_types.ts";

export class ActiveGameStore{

    private lobby_id_to_active_game:Map<string, ActiveGame>;
    private player_id_to_lobby_id:Map<string, string>;

    constructor(){
        this.lobby_id_to_active_game = new Map<string, ActiveGame>();
        this.player_id_to_lobby_id = new Map<string, string>();
    }

    public get_active_game_by_lobby_id(lobby_id:string):ModelResult<ActiveGame, CodeType>{
        const lobby = this.lobby_id_to_active_game.get(lobby_id);
        if (!lobby)
            return {success:false, code:'ACTIVE_GAME_NOT_FOUND'};
        return{success:true, data:lobby};
    }

    public get_active_game_by_player_id(player_id:string):ModelResult<ActiveGame, CodeType>{
        const lobby_id = this.player_id_to_lobby_id.get(player_id);
        if(!lobby_id)
            return {success:false, code:'PLAYER_NOT_FOUND'};
        return this.get_active_game_by_lobby_id(lobby_id);
    }

    public get_all_players_ids():string[]{
        return [...this.player_id_to_lobby_id.keys()];
    }

    public add_active_game(active_game:ActiveGame):ModelResult<null, CodeType>{
        const test_game = this.get_active_game_by_lobby_id(active_game.get_lobby_id());
        if(test_game.success)
            return{success:false, code:'ACTIVE_GAME_EXIST'};
        this.lobby_id_to_active_game.set(active_game.get_lobby_id(), active_game);
        //export all ids of active game to put in player_id_to_lobby_id

        return {success:true, data:null}
    }

    public add_player_to_active_game(
        player_id:string,
        player_in_game:PlayerInGame,
        lobby_id:string
    ):ModelResult<null, CodeType>{

        const lobby_res = this.get_active_game_by_lobby_id(lobby_id);
        if(!lobby_res.success)
            return{success:false, code:'ACTIVE_GAME_NOT_FOUND'};

        const player_res = this.get_active_game_by_player_id(player_id);
        if(player_res.success)
            return{success:false, code:'PLAYER_IN_ACTIVE_GAME'};

        const add_res = lobby_res.data.add_player(player_id, player_in_game);
        if(!add_res.success)
            return add_res;
        
        this.player_id_to_lobby_id.set(player_id, lobby_id);
        return{success:true, data:null}
    }

    public remove_player_from_active_game(
        player_id:string,
        lobby_id:string
    ):ModelResult<null, CodeType>{

        const game_res = this.get_active_game_by_lobby_id(lobby_id);
        if(!game_res.success)
            return game_res;

        const mapped_lobby_id = this.player_id_to_lobby_id.get(player_id);
        if(mapped_lobby_id !== lobby_id)
            return {success:false, code:'PLAYER_NOT_FOUND'};

        const remove_res = game_res.data.remove_player(player_id);
        if(!remove_res.success)
            return remove_res;

        this.player_id_to_lobby_id.delete(player_id);

        return {success:true, data:null};
    }

    public delete_active_game(active_game:ActiveGame):ModelResult<null,CodeType>{
    
        const test_game = this.get_active_game_by_lobby_id(active_game.get_lobby_id());
        if (!test_game.success)
            return { success: false, code: 'ACTIVE_GAME_NOT_FOUND' };

        for (const player_id of active_game.get_players_ids())
            this.player_id_to_lobby_id.delete(player_id)

        this.lobby_id_to_active_game.delete(active_game.get_lobby_id());

        return { success: true, data: null };
    }
}