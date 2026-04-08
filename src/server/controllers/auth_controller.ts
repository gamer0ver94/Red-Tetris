import type { FastifyReply, FastifyRequest } from 'fastify';

import * as auth_services from '../services/auth_services.ts'
import type { PlayerStore } from '../stores/players_store.ts';



// Looks if sid present 
// return is_know :true| false
export async function get_me(
    request: FastifyRequest,
    reply: FastifyReply
){
    
    //Shall be a secret cookies instead
    const sid_cookie = auth_services.read_sid_from_cookie(request)
    const sid = sid_cookie.sid!

    if (!sid)
        return reply.code(200).send({is_known: false});

    const response =  await auth_services.find_me(sid, request.server.player_store);
    
    return reply.code(200).send(response);
}

//Try to create new user with username
// returns success: true|false , player: | reason: 
export async function post_register(
    request: FastifyRequest <{Body : {username: string}}>,
    reply: FastifyReply
){
    
    const username = request.body.username
    if(!username)
        return reply.code(400).send({
            success: false,
            reason: 'Username is required.'
        });

    const response = await auth_services.register(
        request.server.player_store,
        request.body.username,
        request
    );
    if(!response || response.success === false)
        return reply.code(409).send(response ?? { success: false, reason: 'register failed' })

    return reply.code(201).send(response)
}
