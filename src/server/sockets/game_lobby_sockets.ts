import { Store } from "../stores/store.ts";
import * as helpers from '../sockets/misc_sockets.ts'
import * as lobby_services from '../services/game_lobby_services.ts'
import { gameStatusType, playerStatusType } from "../types/status_types.ts";
import type { SocketData, TypedIoServer, TypedSocket } from '../types/socket_event_types.ts';
import { start_game_loop } from "../services/game_loop_services.js";
import { build_render_payload } from "../services/game_render_services.js";
import { codeType } from "../types/error_code_types.js";


export async function socket_game_lobby(
    io:TypedIoServer,
    socket:TypedSocket,
    sid:string,
    store:Store,   
){
    socket.on('lobby:join', async(data) => {
        await join_lobby_event(io, socket, sid, store, data?.game_id);
    });

    socket.on('lobby:start', async() => {
        await start_lobby_event(io, socket, sid, store);
    });

    socket.on('lobby:leave', async() => {
        await leave_lobby_event(io, socket, sid, store);
    });
}


export async function join_lobby_event(
    io:TypedIoServer,
    socket:TypedSocket,
    sid:string,
    store:Store,
    game_id?:string
    ){
        if (!game_id)
            return await socket.emit('lobby:join:error', { reason: codeType['GAME_ID_MISSING']});
        const response = lobby_services.join_game(sid, game_id, store);
        if (!response.success)
            return await socket.emit('lobby:join:error', {reason:codeType[response.code]});
        
        await helpers.change_player_status(io, playerStatusType.waiting, sid, store.get_player_store());
        await socket.emit('lobby:join:success');
        
        if(response.data.socket_ids.length > 0){
            for (const sock of response.data.socket_ids)
                await io.to(sock).emit('lobby:join:update', {message:`${response.data.username} just joined the lobby`});
        }
}

async function start_lobby_event(
    io:TypedIoServer,
    socket:TypedSocket,
    sid:string,
    store:Store
){
    const response = lobby_services.start_game(sid, store);
    if(!response.success)
        return await socket.emit('lobby:start:error', {reason:codeType[response.code]});
    
    const game_id = response.data.game_id;
    const sids = response.data.sids
    const socket_ids = response.data.socket_ids;

    await helpers.change_game_status(io, gameStatusType.started, game_id, sids, store)
    for (const sid_ of sids)
        await helpers.change_player_status(io, playerStatusType.playing, sid_, store.get_player_store());
    for(const socket_id of socket_ids){
        await io.to(socket_id).emit('lobby:start:success');
    }
    const loop_res = start_game_loop(game_id, store, async(game)=>{
        for (const sid of sids){
            const player = store.get_player_store().get_player_by_sid(sid);
            if(!player.success)
                continue;
            const payload = build_render_payload(game, player.data.get_player_id(), store);
            if(payload.success)
                await io.to(player.data.get_socket()).emit('game:render', payload.data);
        }
    });
    if(!loop_res.success)
        await socket.emit('lobby:start:error', {reason: codeType[loop_res.code]});              
}

async function leave_lobby_event(
    io:TypedIoServer,
    socket:TypedSocket,
    sid:string,
    store:Store
){
    const response = lobby_services.leave_game(sid, store);
    
    if(!response.success)
        return await socket.emit('lobby:leave:error', {reason:codeType[response.code]});
    
    if (response.data.deleted)
        return await socket.emit('lobby:leave:success');
    
    if(response.data.new_owner)
        await io.to(response.data.new_owner_socket).emit('lobby:new_owner');
    
    //send lobby:leave:success to socket + change status(go back to connected)
    const leaver_name = response.data.leaver_name;
    for( const socket_id of response.data.socket_ids)
        await io.to(socket_id).emit('lobby:leave:update', {
            message:`${leaver_name} just left the game`
        });
    await socket.emit('lobby:leave:success');
    await helpers.change_player_status(io, playerStatusType.connected, sid, store.get_player_store())
}
