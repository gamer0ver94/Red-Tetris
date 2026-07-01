import type { FastifyReply, FastifyRequest } from 'fastify';

import * as auth_services from '../services/auth_services.ts'
import { AppError } from '../models/app_error_model.js';



// Looks if sid present 
// return is_know :true| false
export async function get_me(
    request: FastifyRequest,
    reply: FastifyReply
){
    
    const {sid} = auth_services.read_sid_from_cookie(request)
    if (!sid)
        return reply.code(200).send({is_known: false});

    const response =  auth_services.find_me(sid, request.server.store.get_player_store());
    if(!response.success)
        throw new AppError(response.code);
    
    if (!response.data.is_known)
        request.session.delete();

    return reply.code(200).send(response.data);
}

//Try to create new user with username
// returns success: true|false , player: | reason: 
export async function post_register(
    request: FastifyRequest <{Body : {username: string}}>,
    reply: FastifyReply
){
    
    const username = request.body.username
    if(!username)
        throw new AppError('USERNAME_REQUIRED', 400);

    const response =  auth_services.register(
        request.server.store.get_player_store(),
        request.body.username,
        request
    );
    if(!response.success)
        throw new AppError(response.code, 409);

    return reply.code(201).send(response.data)
}

export async function logout(
    request: FastifyRequest,
    reply: FastifyReply
){
    const sid_cookie = auth_services.read_sid_from_cookie(request)
    const sid = sid_cookie.sid!

    if (!sid)
        throw new AppError('SID_MISSING', 403);

    const response = auth_services.logout(sid, request.server.store, true);
    
    if(!response.success)
        throw new AppError(response.code, 403);
    const leave_data = response.data.leave_data
    if(leave_data?.new_owner && leave_data.new_owner_socket){
        request.server.io
        .to(leave_data.new_owner_socket)
        .emit("lobby:new_owner")
    }
    const socket_id = response.data.player_socket_id;
    if(socket_id && !socket_id.startsWith('pending_disconnect:'))
        request.server.io.sockets.sockets.get(socket_id)?.disconnect(true);

    request.session.delete();
    return reply.code(200).send({success: true});
}
