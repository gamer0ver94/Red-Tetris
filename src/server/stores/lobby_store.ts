import { Lobby } from "../models/lobby_model.ts";
import { ModelResult, CodeType } from "../types/error_code_types.ts";

export class LobbyStore{

    private id_to_lobby_map:Map<string, Lobby>;
    private player_id_to_lobby_id:Map<string, string>;

    constructor(){
        this.id_to_lobby_map = new Map<string, Lobby>();
        this.player_id_to_lobby_id = new Map<string, string>();
    }

    //Getters
    public get_lobby_by_id(lobby_id:string):ModelResult<Lobby, CodeType>{
        const lobby = this.id_to_lobby_map.get(lobby_id);
        if(!lobby)
            return {success:false, code:'LOBBY_NOT_FOUND'};
        return {success:true, data:lobby};
    }

    public get_lobby_by_player_id(player_id:string):ModelResult<Lobby,CodeType>{
        const lobby_id = this.player_id_to_lobby_id.get(player_id);
        if(!lobby_id)
            return {success:false, code:'PLAYER_NOT_FOUND'};
        return this.get_lobby_by_id(lobby_id);
    }

    public get_all_players_ids():string[]{
        return [...this.player_id_to_lobby_id.keys()];
    }

    //Setters
    public add_lobby(lobby:Lobby):ModelResult<null, CodeType>{
        const test_lobby = this.id_to_lobby_map.get(lobby.get_lobby_id());
        if(test_lobby)
            return {success:false, code:'LOBBY_EXIST'};
        this.id_to_lobby_map.set(lobby.get_lobby_id(), lobby);
        return {success:true, data:null};
    }

    public add_player_to_lobby(player_id:string, lobby_id:string):ModelResult<null, CodeType>{
        
        const res_player = this.get_lobby_by_player_id(player_id);
        if(res_player.success)
            return {success:false, code:'PLAYER_IN_LOBBY'};
        
        const lobby_res = this.get_lobby_by_id(lobby_id);
        if(!lobby_res.success)
            return lobby_res;
        if(!lobby_res.data.can_join())
            return{success:false, code:'LOBBY_CANNOT_JOIN'};

        this.player_id_to_lobby_id.set(player_id, lobby_id);
        lobby_res.data.add_player(player_id);
        return{success:true, data:null};
    }

    public remove_player_from_lobby(
        player_id: string,
        lobby_id: string,
    ): ModelResult<null, CodeType> {

        const lobby_res = this.get_lobby_by_id(lobby_id);
        if (!lobby_res.success)
            return lobby_res;

        const lobby = lobby_res.data;

        if (!lobby.has_player(player_id))
            return { success: false, code: 'PLAYER_NOT_FOUND' };

        const mapped_lobby_id = this.player_id_to_lobby_id.get(player_id);
        if (mapped_lobby_id !== lobby_id)
            return { success: false, code: 'PLAYER_NOT_FOUND' };

        lobby.remove_player(player_id);
        this.player_id_to_lobby_id.delete(player_id);

        return { success: true, data: null };
    }


    public delete_lobby(lobby_id: string): ModelResult<null, CodeType> {
        
        const lobby_res = this.get_lobby_by_id(lobby_id);
        if (!lobby_res.success)
            return lobby_res;

        const lobby = lobby_res.data;

        for (const player_id of lobby.get_player_ids())
            this.player_id_to_lobby_id.delete(player_id);

        this.id_to_lobby_map.delete(lobby_id);

        return { success: true, data: null };
    }

}