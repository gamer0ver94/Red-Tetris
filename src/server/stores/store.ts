import { PlayerStore } from "./players_store.ts";
import { LobbyStore } from "./lobby_store.ts";
import { ActiveGameStore } from "./active_game_store.ts";
import { ModelResult, type CodeType } from "../types/error_code_types.ts";
import { Board } from "../models/board_model.js";
import { PlayerInGame } from "../models/player_in_game_model.js";


export class Store{

    private lobby: LobbyStore;
    private active_game: ActiveGameStore;
    private players: PlayerStore;

    constructor(){
        this.players = new PlayerStore();
        this.lobby = new LobbyStore();
        this.active_game = new ActiveGameStore();
    }



    public get_player_store(){
        return this.players;
    }

    public get_active_game_store(){
        return this.active_game;
    }

    public get_lobby_store(){
        return this.lobby;
    }


    public get_all_sockets_by_lobby_id(lobby_id:string):ModelResult<string[], CodeType>{

        const lobby_res = this.lobby.get_lobby_by_id(lobby_id);
        if(!lobby_res.success)
            return lobby_res

        let socket_ids:string[] = [];
        for(const player_id of lobby_res.data.get_player_ids()){
            const player_res = this.players.get_player_by_id(player_id);
            if (player_res.success)
                socket_ids.push(player_res.data.get_socket());
        }
        return {success:true, data:socket_ids};
    }

    public get_all_sids_by_lobby_id(lobby_id:string):ModelResult<string[], CodeType>{

        const lobby_res = this.lobby.get_lobby_by_id(lobby_id);
        if(!lobby_res.success)
            return lobby_res;

        let sids:string[] = [];
        for(const player_id of lobby_res.data.get_player_ids()){
            const p_res = this.players.get_player_by_id(player_id);
            if(p_res.success)
                sids.push(p_res.data.get_sid());
        }
        return {success:true, data:sids};
    }

    public get_board_by_sid(sid:string):ModelResult<Board, CodeType>{

        const player_res = this.players.get_player_by_sid(sid);
        if(!player_res.success)
            return player_res;

        const active_game_res = this.active_game.get_active_game_by_player_id(player_res.data.get_player_id());
        if(!active_game_res.success)
            return active_game_res;

        const player_in_game_res = active_game_res.data.get_player(player_res.data.get_player_id());
        if(!player_in_game_res.success)
            return player_in_game_res;

        return {success:true, data:player_in_game_res.data.get_board()};
    }

    public get_player_in_game_by_sid(sid:string):ModelResult<PlayerInGame, CodeType>{

        const p_res = this.players.get_player_by_sid(sid);
        if(!p_res.success)
            return p_res;

        const active_game_res = this.active_game.get_active_game_by_player_id(p_res.data.get_player_id());
        if(!active_game_res.success)
            return active_game_res;

        const player_res = active_game_res.data.get_player(p_res.data.get_player_id());
        return player_res;
    }
}