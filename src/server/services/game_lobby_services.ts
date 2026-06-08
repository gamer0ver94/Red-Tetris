import {randomBytes} from 'node:crypto'

import { Player } from '../models/player_model.ts'
import { Store } from '../stores/store.ts'
import { LobbyStore } from '../stores/lobby_store.js'
import { Lobby } from '../models/lobby_model.js'
import { find_me } from './auth_services.ts'

import { setup_active_game } from './game_setup_services.js'
import { stop_game_loop } from './game_loop_services.js'

import { MAPPED_OPTS, type GameMode } from '../types/pre_made_options.js'
import { GameOptions } from '../types/game_options_types.js'
import { CodeType, LeaveGameData, JoinLobbyData, ModelResult, StartGameData } from '../types/error_code_types.js'
import { gameStatusType, playerStatusType } from '../types/status_types.ts'

export function join_game(
    sid:string,
    lobby_id:string,
    store:Store,
):ModelResult<JoinLobbyData, CodeType>{
    const player_res =  store.get_player_store().get_player_by_sid(sid);
    if(!player_res.success)
        return player_res;
    const player = player_res.data;

    const lobby_res =  store.get_lobby_store().get_lobby_by_id(lobby_id);
    if (!lobby_res.success)
        return lobby_res;
    const lobby = lobby_res.data

    const add_res = store.get_lobby_store().add_player_to_lobby(player.get_player_id(), lobby.get_lobby_id());
    if(!add_res.success)
        return add_res;
    
    const username = player.get_username();
    const socket_ids_res =  store.get_all_sockets_by_lobby_id(lobby.get_lobby_id());
    if(!socket_ids_res.success)
        return socket_ids_res;

    const socket_ids = socket_ids_res.data

    const players_list = store.get_all_usernames_by_lobby_id(lobby.get_lobby_id());
    if(!players_list.success)
        return players_list;

    return { success:true, data:{username, socket_ids, players_list: players_list.data }};
}

export function start_game(sid:string, store:Store):ModelResult<StartGameData, CodeType>{
    
    const player_res = store.get_player_store().get_player_by_sid(sid);
    if(!player_res.success)
        return player_res;
    const player = player_res.data;

    const lobby_res = store.get_lobby_store().get_lobby_by_player_id(player.get_player_id());
    if(!lobby_res.success)
        return lobby_res;
    const lobby = lobby_res.data;

    if(!lobby.is_owner(player.get_player_id()))
        return {success:false, code:'NOT_OWNER'};

    const game_id = lobby.get_lobby_id();
    const opts = lobby.get_game_opts();
      
    const socket_res = store.get_all_sockets_by_lobby_id(lobby.get_lobby_id());
    if(!socket_res.success)
        return socket_res;
    const socket_ids = socket_res.data
    
    const start_res = setup_active_game(lobby, store);
    if(!start_res.success)
        return start_res;
    
    const sids_res = store.get_all_sids_by_lobby_id(lobby.get_lobby_id());
    if(!sids_res.success)
        return sids_res
    const sids = sids_res.data;

    lobby.set_game_status(gameStatusType.started);
    const game_status = lobby.get_game_status(); 
    
    return {success:true, data:{
        game_id,
        opts,
        game_status,
        socket_ids,
        sids,
        },
    };
}

export function create_game(
    store:Store,
    user_sid: string,
    game_mode: string,
    game_opts?:GameOptions,
):ModelResult<string, CodeType>{
    const player_data_res = find_me(user_sid, store.get_player_store());
    if(!player_data_res.success)
        return player_data_res;

    const owner_id = player_data_res.data.player_id!;

    const lobby_id = generate_unique_lobby_id(store.get_lobby_store());
    if(!game_opts)
        game_opts = resolve_opts_from_mode(game_mode);
    if(!game_opts)
        game_opts = MAPPED_OPTS['classic'];
    const lobby = new Lobby(
        lobby_id,
        owner_id,
        game_opts
    );

    const lobby_res = store.get_lobby_store().add_lobby(lobby);
    if(!lobby_res.success)
        return lobby_res;

    lobby.set_game_status(gameStatusType.waiting);
    const add_res = store.get_lobby_store().add_player_to_lobby(owner_id, lobby_id)
    if(!add_res.success)
        return add_res;

    return {
        success:true,
        data: lobby_id,
    };

}

export function leave_game(sid: string, store: Store):ModelResult<LeaveGameData, CodeType> {
    const player_res = store.get_player_store().get_player_by_sid(sid);
    if (!player_res.success)
        return player_res;
    const player = player_res.data;

    const lobby_res = store.get_lobby_store().get_lobby_by_player_id(player_res.data.get_player_id());
    if (!lobby_res.success)
        return lobby_res;
    const lobby = lobby_res.data;

    if(lobby.get_game_status() === gameStatusType.waiting)
        return leave_game_waiting(player, lobby, store);

    if (lobby.get_game_status() === gameStatusType.started)
        return leave_game_started(player, lobby, store)

    return { success: false, code: 'GAME_STATUS_UNKNOWN' };
}

function leave_game_waiting(player: Player, lobby: Lobby, store: Store):ModelResult<LeaveGameData, CodeType> {
    
    const player_id = player.get_player_id();
    const lobby_id = lobby.get_lobby_id();
    const was_owner = lobby.is_owner(player_id);
    const leaver_name = player.get_username();

    const remove_res = store.get_lobby_store().remove_player_from_lobby(player_id, lobby_id);

    if(!remove_res.success)
        return remove_res;

    if(lobby.get_player_count() === 0){
        const delete_res = store.get_lobby_store().delete_lobby(lobby_id);
        if(!delete_res.success)
            return delete_res;
        return{
            success:true,
            data:{
                deleted:true,
                stopped_loop:false,
                leaver_name,
                socket_ids:[],
                new_owner:false,
            },
        };
    }
    let new_owner = false;
    let new_owner_socket:string|undefined;

    if(was_owner){
        const new_owner_id = lobby.get_player_ids()[0];
        lobby.set_owner(new_owner_id);

        const owner_res = store.get_player_store().get_player_by_id(new_owner_id);
        if(owner_res.success){
            new_owner = true;
            new_owner_socket = owner_res.data.get_socket();
        }
    }
    const socket_res = store.get_all_sockets_by_lobby_id(lobby_id);
    if(!socket_res.success)
        return socket_res;

    return{
        success:true,
        data:{
            deleted:false,
            stopped_loop:false,
            new_owner,
            new_owner_socket,
            leaver_name,
            socket_ids:socket_res.data,
        },
    };
}

function leave_game_started(player: Player, lobby: Lobby, store: Store):ModelResult<LeaveGameData, CodeType> {
    const player_id = player.get_player_id();
    const lobby_id = lobby.get_lobby_id();
    const leaver_name = player.get_username();
    const socket_res = store.get_all_sockets_by_lobby_id(lobby_id);


    const game_remove_res = store.get_active_game_store().remove_player_from_active_game(player_id, lobby_id);
    if (!game_remove_res.success)
        return game_remove_res;

    const lobby_remove_res = store.get_lobby_store().remove_player_from_lobby(player_id, lobby_id);
    if(!lobby_remove_res.success)
        return lobby_remove_res;

    const active_game_res = store.get_active_game_store().get_active_game_by_lobby_id(lobby_id);
    //Shall stop based on opts in a game_end_services.ts ? 
    const need_stop = true;

    let stopped_loop = false;
    if(need_stop){

        const stop_res = stop_game_loop(lobby_id);
        stopped_loop = stop_res.success;

        lobby.set_game_status(gameStatusType.finish);
    
        if(active_game_res.success)
            store.get_active_game_store().delete_active_game(active_game_res.data);
    
        store.get_lobby_store().delete_lobby(lobby_id)
    }
    
    const socket_ids = socket_res.success ? socket_res.data : [];

    return{
        success:true,
        data:{
            deleted:need_stop,
            stopped_loop,
            forfeit:true,
            leaver_name,
            socket_ids,
            new_owner:false,
        },
    };
}


export function ready_player(player:Player){
    if(player.get_player_status() === playerStatusType.ready)
        player.set_player_status(playerStatusType.waiting);
    else
        player.set_player_status(playerStatusType.ready);
}


function generate_unique_lobby_id(lobby_store: LobbyStore) : string{
    while (true){
        const id = randomBytes(2).toString('hex');
        const store_res = lobby_store.get_lobby_by_id(id) 
        if (! store_res.success)
            return id;
    }

}

function is_game_mode(mode:string): mode is GameMode{
    return mode in MAPPED_OPTS;
}

function resolve_opts_from_mode(mode:string){
    if(!is_game_mode(mode))
        return undefined;
    return MAPPED_OPTS[mode];
}
