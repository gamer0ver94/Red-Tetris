import type { FastifyReply, FastifyRequest } from 'fastify';
import { read_sid_from_cookie, find_me } from '../services/auth_services.js';
import { AppError } from '../models/app_error_model.js';
import { HistoryProvider } from '../models/history_provider.js';

export async function get_me_history(
    request:FastifyRequest<{Querystring: {start?:number, end?:number}}>,
    reply:FastifyReply
){
        const {start = 0, end = 10} = request.query
        const {sid} = read_sid_from_cookie(request)
        if (!sid)
            throw new AppError('SID_MISSING', 403);
        const player_res = find_me(sid, request.server.store.get_player_store());
        if (!player_res.success || player_res.data.is_known == false)
            throw new AppError('PLAYER_NOT_FOUND', 403);
        const data = HistoryProvider.get_history_by_username(
            player_res.data.username!,start, end)
        return reply.code(200).send({data})
        
}

export async function get_users_history(
    request:FastifyRequest<{Params: { query:string}, Querystring:{start:number, end:number}}>,
    reply:FastifyReply
){
    const {start = 0, end = 10} = request.query;
    const {query} = request.params;
    const {sid} = read_sid_from_cookie(request)
    if (!sid)
        throw new AppError('SID_MISSING', 403);
    const data = HistoryProvider.search_username_in_history(query, start, end);
    return reply.code(200).send({data}); 

}

export async function get_mode_history(
    request:FastifyRequest<{Params: { mode:string}, Querystring: {start:number, end:number}}>,
    reply:FastifyReply
){
    const {start = 0, end = 10} = request.query;
    const {mode} = request.params;
    const {sid} = read_sid_from_cookie(request)
    if (!sid)
        throw new AppError('SID_MISSING', 403);
    const data = HistoryProvider.get_history_by_mode(mode, start, end);
    return reply.code(200).send({data}); 
}

export async function get_date_history(
    request:FastifyRequest<{Querystring: {start:number, end:number, new_first:boolean}}>,
    reply:FastifyReply
){
    const {start = 0, end = 10, new_first} = request.query;

    const {sid} = read_sid_from_cookie(request);
    if (!sid)
        throw new AppError('SID_MISSING', 403);

    const data = HistoryProvider.get_history_by_date(new_first, start, end);
    return reply.code(200).send({data});
}

export async function get_score_history(
    request:FastifyRequest<{Querystring: {start:number, end:number}}>,
    reply:FastifyReply
){
    const {start = 0, end = 10} = request.query;
    const {sid} = read_sid_from_cookie(request)
    if (!sid)
        throw new AppError('SID_MISSING', 403);
    const data = HistoryProvider.get_history_by_score(start, end);
    return reply.code(200).send({data}); 
}

export async function get_lobby_history(
    request:FastifyRequest<{Params: {lobby_id:string}, Querystring:{start:number, end:number}}>,
    reply:FastifyReply
){
    const {start = 0, end = 10} = request.query;
    const {lobby_id} = request.params;
    const {sid} = read_sid_from_cookie(request)
    if (!sid)
        throw new AppError('SID_MISSING', 403);
    const data = HistoryProvider.get_history_by_lobby_id(lobby_id, start, end);
    return reply.code(200).send({data}); 
}

export async function get_win_history(
    request:FastifyRequest<{Querystring:{start:number, end:number}}>,
    reply:FastifyReply
){
    const {start = 0, end = 10} = request.query;

    const {sid} = read_sid_from_cookie(request)
    if (!sid)
        throw new AppError('SID_MISSING', 403);
    const data = HistoryProvider.get_history_by_win(start, end);
    return reply.code(200).send({data}); 
}

export async function get_lose_history(
    request:FastifyRequest<{Querystring:{start:number, end:number}}>,
    reply:FastifyReply
){
    const {start = 0, end = 10} = request.query;

    const {sid} = read_sid_from_cookie(request)
    if (!sid)
        throw new AppError('SID_MISSING', 403);
    const data = HistoryProvider.get_history_by_lose(start, end);
    return reply.code(200).send({data}); 
}