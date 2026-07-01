import { Player } from "../models/player_model.ts";
import { PlayerStore } from "../stores/players_store.ts";
import { Store } from "../stores/store.ts";
import type { TypedIoServer } from "../types/socket_event_types.ts";
import type { FastifyRequest } from 'fastify';

import { randomBytes, randomUUID } from 'node:crypto'
import { leave_game } from "./game_lobby_services.ts";
import { CodeType, ModelResult, LogoutData, LeaveGameData, PlayerData } from "../types/error_code_types.js";
import { playerStatusType } from "../types/status_types.js";


// Looks if user is in memory by secret id
export function find_me(sid: string, player_store: PlayerStore):ModelResult<PlayerData, CodeType>{

    const player_res = player_store.get_player_by_sid(sid)

    if(!player_res.success)
        return {success:true, data:{is_known:false}};
    
    const player = player_res.data;
    return {
        success:true,
        data:{
            is_known:true,
            player_id:player.get_player_id(),
            username:player.get_username(),
            player_status:player.get_player_status(),
            socket_id: player.get_socket(),
            csrf_token: player.get_csrf_token(),
        },
    };
}

//Try to create new player, if fails returns reason
export function register(
    player_store: PlayerStore,
    username:string,
    request:FastifyRequest,
):ModelResult<PlayerData, CodeType>{

    const sidInSession = request.session.get('sid');
    if (sidInSession) {
        const known = player_store.get_player_by_sid(sidInSession);
        if (known.success)
            return { success: false, code: 'PLAYER_LOGIN' };
    }

    const sid =  make_new_sid(player_store);
    const id = make_new_id( player_store.get_all_ids());
    const csrf_token = randomBytes(24).toString('hex');
    const created_at = new Date().toISOString();
    const mock_sock = `user:created_at:${Date.now()}`;
    const player = new Player(
        id,
        username,
        'waiting_socket',
        sid,
        mock_sock,
        created_at,
        csrf_token
    );
    
    const response = player_store.add_player(player);
    if (!response.success)
        return {success: false, code: response.code};
    
    request.session.set('sid', sid);
    return {
        success:true,
        data:{
        is_known:true,
        player_id:player.get_player_id(),
        username:player.get_username(),
        player_status:player.get_player_status(),
        socket_id: player.get_socket(),
        csrf_token: player.get_csrf_token(),
        }
    }
    
}

export function logout(
    sid:string,
    store:Store,
    delete_user: boolean = true
):ModelResult<LogoutData, CodeType>{
    const player_res = store.get_player_store().get_player_by_sid(sid);
    if (!player_res.success)
        return player_res;
    const player = player_res.data

    let leave_data:LeaveGameData|null = null;

    
    const lobby_res = store.get_lobby_store().get_lobby_by_player_id(player.get_player_id());
    if(lobby_res.success){
        const active_game_res = store.get_active_game_store().get_active_game_by_lobby_id(lobby_res.data.get_lobby_id());
        if(active_game_res.success){
            const active_leave_res = leave_game(player.get_sid(), store);
            if(!active_leave_res.success)
                return active_leave_res
            player.set_player_status(active_leave_res.data.status);
        }
        const leave_res = leave_game(player.get_sid(), store);
        if (!leave_res.success)
            return leave_res;
        leave_data = leave_res.data;
    }
    if(delete_user){
        const remove_res = store.get_player_store().remove_player(player);
        if(!remove_res.success)
            return remove_res;
    }
    return {success:true, data:{
        was_in_game: leave_data !== null,
        leave_data,
        deleted_user:delete_user,
        player_id: player.get_player_id(),
        player_socket_id:player.get_socket(),
        username:player.get_username(),
    }};
}

export function read_sid_from_cookie(request: FastifyRequest) : {sid?: string} {
    return {sid: request.session.get('sid')};
}

// STATIC HELPERS
// Generate sid until it's unique
function make_new_sid(player_store: PlayerStore): string{
    while (true){
        const sid = randomBytes(24).toString('hex');
        const known = player_store.get_player_by_sid(sid);
        if(!known.success) return sid;
    }
}

// Generate id until it's unique
function make_new_id(ids:string[]) : string{
    while (true){
        const uid = randomUUID();
        if (!ids.includes(uid)) return uid;
    }
}
