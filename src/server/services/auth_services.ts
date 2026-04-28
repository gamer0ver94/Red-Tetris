import { Player } from "../models/player_model.ts";
import { PlayerStore } from "../stores/players_store.ts";
import { Store } from "../stores/store.ts";
import type { TypedIoServer } from "../types/socket_event_types.ts";
import type { FastifyRequest } from 'fastify';

import { randomBytes, randomUUID } from 'node:crypto'
import { playerStatusType } from "../types/status_types.js";
import { leave_game } from "./game_lobby_services.js";


// Looks if user is in memory by secret id
export async function find_me(sid: string, player_store: PlayerStore){

    const player = await player_store.get_player_by_sid(sid)
    
    if (player !== undefined)
        return {
            is_known:true,
            player_id:player.get_player_id(),
            username:player.get_username(),
            player_status:player.get_player_status(),
            socket_id: player.get_socket(),
            csrf_token: player.get_csrf_token(),
        }
    return {is_known: false}
}

//Try to create new player, if fails returns reason
export async function register(
    player_store: PlayerStore,
    username:string,
    request:FastifyRequest,
){

    const sidInSession = request.session.get('sid');
    if (sidInSession) {
    const known = await player_store.get_player_by_sid(sidInSession);
    if (known) return { success: false, reason: 'You are already logged in' };
    }

    const sid = await make_new_sid(player_store);
    const id = await make_new_id(await player_store.get_all_ids());
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
    
    const response = await player_store.add_player(player);

    if (response !== "success")
        return {success: false, reason: response};
    
    request.session.set('sid', sid);
    return {
        success:true,
        player_id:player.get_player_id(),
        username:player.get_username(),
        player_status:player.get_player_status(),
        socket_id: player.get_socket(),
        csrf_token: player.get_csrf_token(),
    }
    
}

export async function logout(
    sid:string,
    store:Store,
    io:TypedIoServer,
    delete_user: boolean = true
){
    const player = await store.get_player_store().get_player_by_sid(sid);
    if (!player)
        return {success: false, reason: 'Player not found'};

    if(await store.get_game_store().get_game_by_player_id(player.get_player_id())){
            const res = await leave_game(player.get_sid(), store);
            if (res.success == false)
                return {success:res.success, reason: res.reason};
            if (res.res?.new_owner)
                 await io.to(res!.res!.new_owner_socket).emit('lobby:new_owner');
        for( const socket_id of res.res?.socket_ids ?? [])
            await io.to(socket_id).emit('lobby:leave:update', {
                message:`${res.res?.leaver_name} just left the game`
            });
        await io.to(player.get_socket()).emit('lobby:leave:success');
    }
    if(delete_user)
        await store.get_player_store().remove_player(player);
    return {success: true};
}

export function read_sid_from_cookie(request: FastifyRequest) : {sid?: string} {
    return {sid: request.session.get('sid')};
}

// STATIC HELPERS
// Generate sid until it's unique
async function make_new_sid(player_store: PlayerStore): Promise<string>{
    while (true){
        const sid = randomBytes(24).toString('hex');
        const known = await player_store.get_player_by_sid(sid);
        if(!known) return sid;
    }
}

// Generate id until it's unique
async function make_new_id(ids:Set<string>) : Promise<string>{
    while (true){
        const uid = randomUUID();
        if (! ids.has(uid)) return uid;
    }
}
