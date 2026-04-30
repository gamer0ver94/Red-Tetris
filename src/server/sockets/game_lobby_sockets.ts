import { Store } from "../stores/store.ts";
import * as helpers from '../sockets/misc_sockets.ts'
import * as lobby_services from '../services/game_lobby_services.ts'
import { gameStatusType, playerStatusType } from "../types/status_types.ts";
import type { SocketData, TypedIoServer, TypedSocket } from '../types/socket_event_types.ts';
import { start_game_loop } from "../services/game_loop_services.js";
import { build_render_payload } from "../services/game_render_sercives.js";


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
            return await socket.emit('lobby:join:error', { reason: 'missing game id'});
        const response = await lobby_services.join_game(sid, game_id, store);
        if (!response.success)
            return await socket.emit('lobby:join:error', {reason:response.reason});
        
        await helpers.change_player_status(io, playerStatusType.waiting, sid, store.get_player_store());
        await socket.emit('lobby:join:success');
        
        if(response!.socket_ids!.size){
            for (const sock of response.socket_ids!)
                await io.to(sock).emit('lobby:join:update', {message:`${response.username!} just joined the game`});
        }
}

async function start_lobby_event(
    io:TypedIoServer,
    socket:TypedSocket,
    sid:string,
    store:Store
){
    const response = await lobby_services.start_game(sid, store);
    if(!response.success)
        return await socket.emit('lobby:start:error', {reason:response.reason});
    
    const game_id = response.game_response!.game_id;
    const sids = response.sids!;
    const socket_ids = response.socket_ids!;

    await helpers.change_game_status(io, gameStatusType.started, game_id, sids, store)
    for (const sid_ of sids)
        await helpers.change_player_status(io, playerStatusType.playing, sid_, store.get_player_store());
    for(const socket_id of socket_ids){
        await io.to(socket_id).emit('lobby:start:success', {data:response.game_response!});
    }
    const loop_res = await start_game_loop(game_id, store, async(game)=>{
        for (const sid of sids){
            const player = await store.get_player_store().get_player_by_sid(sid);
            if(!player)
                continue;
            const payload = await build_render_payload(game, player.get_player_id(), store);
            await io.to(player.get_socket()).emit('game:render', payload);
        }
    });
    if(!loop_res.success)
        await socket.emit('lobby:start:error', {reason: loop_res.reason});              
}

async function leave_lobby_event(
    io:TypedIoServer,
    socket:TypedSocket,
    sid:string,
    store:Store
){
    const response = await lobby_services.leave_game(sid, store);
    console.log(response);
    
    if(!response.success)
        return await socket.emit('lobby:leave:error', {reason:response!.reason});
    
    if (response.res!.deleted)
        return await socket.emit('lobby:leave:success');
    
    if(response.res!.new_owner)
        await io.to(response!.res!.new_owner_socket).emit('lobby:new_owner');
    
    //send lobby:leave:success to socket + change status(go back to connected)
    const leaver_name = response!.res!.leaver_name;
    for( const socket_id of response.res!.socket_ids!)
        await io.to(socket_id).emit('lobby:leave:update', {
            message:`${leaver_name} just left the game`
        });
    await socket.emit('lobby:leave:success');
    await helpers.change_player_status(io, playerStatusType.connected, sid, store.get_player_store())
}
