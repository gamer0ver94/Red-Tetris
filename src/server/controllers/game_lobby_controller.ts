import type { FastifyReply, FastifyRequest } from 'fastify';

import * as game_services from '../services/game_lobby_services.ts';
import { read_sid_from_cookie, find_me } from '../services/auth_services.ts';
import * as helpers from '../sockets/misc_sockets.ts'
import { gameStatusType, playerStatusType } from '../types/status_types.ts';

export async function post_create(
    request:FastifyRequest <{Body : {
        csrf_token: string,
        game_type: 'single_player' | 'multi_player',
        game_mode: string
    } }>,
    reply:FastifyReply
){
    const sid_cookie = read_sid_from_cookie(request)
    const sid = sid_cookie.sid!
    if (!sid)
        return reply.code(403).send({success:false, reason:'Missing sid'});
    
    const player_data = await find_me(sid, request.server.store.get_player_store());
    if (!player_data || player_data.is_known == false)
        return reply.code(403).send({success: false, reason:'No player found'});

    if(player_data.csrf_token !== request.headers['x-csrf-token'])
        return reply.code(403).send({success: false, reason:'Token manipulation'})

    const response = await game_services.create_game(
        request.server.store,
        sid,
        request.body.game_type,
        request.body.game_mode,
        );
    if (!response || response.success == false)
        return reply.code(409).send(response);
    
    await helpers.change_player_status(
        request.server.io,
        playerStatusType.waiting,
        sid,
        request.server.store.get_player_store());
    const sids_set = new Set<string>();
    sids_set.add(sid);
    await helpers.change_game_status(
        request.server.io,
        gameStatusType.waiting,
        response.game_id!,
        sids_set,
        request.server.store
    )
    return reply.code(201).send({
        success: response.success,
        game_id: response.game_id,
        game_type: request.body.game_type,
        game_mode: request.body.game_mode,
    });
}

export async function get_join() {
    
    //Create player obj with name guest_n
    //Add player to game_id from request
    //return player + game data, then server expect socket connection from front  
}