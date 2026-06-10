import type { FastifyReply, FastifyRequest } from 'fastify';

import * as game_services from '../services/game_lobby_services.ts';
import { read_sid_from_cookie, find_me } from '../services/auth_services.ts';
import * as helpers from '../sockets/misc_sockets.ts'
import { gameStatusType, playerStatusType } from '../types/status_types.ts';
import { AppError } from '../models/app_error_model.js';
import { GameOptions } from '../types/game_options_types.js';

export async function post_create(
    request:FastifyRequest <{Body : {
        csrf_token: string,
        game_mode: string,
        options?:GameOptions
    } }>,
    reply:FastifyReply
){
    const {sid} = read_sid_from_cookie(request)
    if (!sid)
        throw new AppError('SID_MISSING', 403);
    
    const player_res = find_me(sid, request.server.store.get_player_store());
    if (!player_res.success || player_res.data.is_known == false)
        throw new AppError('PLAYER_NOT_FOUND', 403);

    const player = player_res.data;
    if(player.csrf_token !== request.headers['x-csrf-token'])
        throw new AppError('CSRF_MANIP', 403);

    const response = game_services.create_game(
        request.server.store,
        sid,
        request.body.game_mode,
        request.body.options,
    );
    if (!response.success)
        throw new AppError(response.code, 409);
    
    await helpers.change_player_status(
        request.server.io,
        playerStatusType.waiting,
        sid,
        request.server.store.get_player_store());

    await helpers.change_game_status(
        request.server.io,
        gameStatusType.waiting,
        response.data,
        [sid],
        request.server.store
    )
    return reply.code(201).send({
        success: response.success,
        game_id: response.data,
    });
}

export async function get_join(request:FastifyRequest<{Params: {game_id:string, username:string}}>, reply:FastifyReply) {
    const { game_id, username } = request.params;

    const {sid} = read_sid_from_cookie(request);
    if (!sid)
        throw new AppError('SID_NOT_FOUND', 403);

    const user_res = find_me(sid, request.server.store.get_player_store());
    if(!user_res.success)
        throw new AppError(user_res.code);
    if (!user_res.data.is_known)
        throw new AppError('PLAYER_NOT_FOUND', 404);

    if (user_res.data.username !== username)
        throw new AppError('USERNAME_MISMATCH', 403);

    const game_res = request.server.store.get_lobby_store().get_lobby_by_id(game_id);
    if (!game_res.success)
        throw new AppError('LOBBY_NOT_FOUND', 404);
    const game = game_res.data;

    if (game.get_game_status() !== gameStatusType.waiting)
        throw new AppError('LOBBY_CANNOT_JOIN', 409);

    return reply.code(200).send({
        success: true,
        game_id,
        player_id: user_res.data.player_id,
        username: user_res.data.username,
        csrf_token: user_res.data.csrf_token,
        game_status: game.get_game_status(),
        is_host: game.get_owner_id() === user_res.data.player_id,
    });
}
