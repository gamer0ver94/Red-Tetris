import { Player } from "../models/player_model";
import { PlayerStore } from "../stores/players_store";
import type { FastifyRequest } from 'fastify';

import { randomBytes, randomUUID } from 'node:crypto'


// Looks if user is in memory by secret id
export async function find_me(sid: string, player_store: PlayerStore){

    const player = await player_store.is_known(sid)
    
    if (player !== undefined)
        return {
            is_known:true,
            player_id:player.get_player_id(),
            username:player.get_username(),
            state:player.get_state(),
            sid: player.get_sid(),
            socket: player.get_socket(),
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

    const sid = await make_new_sid(player_store);
    const id = await make_new_id(await player_store.get_all_ids());
    const csrf_token = randomBytes(24).toString('hex');
    const created_at = new Date().toISOString();
    const mock_sock = `user:created_at:${Date.now()}`;
    const player = new Player(
        id,
        username,
        'waiting socket',
        sid,
        mock_sock,
        created_at,
        csrf_token
    );
    
    request.session.set('sid', sid);

    const response = await player_store.add_player(player);

    if (response !== "success")
        return {success: false, reason: response};
    return {
        success:true,
        player_id:player.get_player_id(),
        username:player.get_username(),
        state:player.get_state(),
        socket: player.get_socket(),
        csrf_token: player.get_csrf_token(),
    }
    
}

export function read_sid_from_cookie(request: FastifyRequest) : {sid?: string} {
    return {sid: request.session.get('sid')};
}

// STATIC HELPERS
// Generate sid until it's unique
async function make_new_sid(player_store: PlayerStore): Promise<string>{
    while (true){
        const sid = randomBytes(24).toString('hex');
        const known = await player_store.is_known(sid);
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
