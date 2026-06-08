import { Store } from "../stores/store.ts";
import * as helpers from '../sockets/misc_sockets.ts'
import * as lobby_services from '../services/game_lobby_services.ts'
import { gameStatusType, playerStatusType } from "../types/status_types.ts";
import type { SocketData, TypedIoServer, TypedSocket } from '../types/socket_event_types.ts';
import { start_game_loop } from "../services/game_loop_services.js";
import { build_render_payload } from "../services/game_render_services.js";
import { codeType } from "../types/error_code_types.js";
import { change_player_status, change_game_status } from "../sockets/misc_sockets.ts";
import {LobbyPlayerState, LobbyReadyPayload} from '../types/socket_event_types.ts';
import { ModelResult, CodeType } from '../types/error_code_types.ts';



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

    socket.on('lobby:ready', async() => {
        await ready_lobby_event(io, socket, sid, store);
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
                await io.to(sock).emit('lobby:join:update', {message:`${response.data.username} just joined the lobby`, players_list: response.data.players_list });
        }
}

async function start_lobby_event(
    io:TypedIoServer,
    socket:TypedSocket,
    sid:string,
    store:Store
){

    const all_ready = store.are_all_players_ready(sid);
    if(!all_ready.success)
        return await socket.emit('lobby:start:error', {reason:'Not all players are ready'});

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
    const loop_res = start_game_loop(game_id, store, async(game, match_results)=>{
        if(match_results){
            for (const id of match_results.winners_id){
                const player_res = store.get_player_store().get_player_by_id(id);
                if(player_res.success){
                    await io.to(player_res.data.get_socket()).emit('game:win');
                    await change_player_status(io, playerStatusType.waiting, player_res.data.get_sid(), store.get_player_store());
                }
            }
            for (const id of match_results.losers_id){
                const player_res = store.get_player_store().get_player_by_id(id);
                if(player_res.success){
                    await io.to(player_res.data.get_socket()).emit('game:lose');
                    await change_player_status(io, playerStatusType.waiting, player_res.data.get_sid(), store.get_player_store());
                }
            }
            await change_game_status(io, gameStatusType.waiting, game_id, sids, store);
            const active_game_res = store.get_active_game_store().get_active_game_by_lobby_id(game_id);
            if(active_game_res.success)
                store.get_active_game_store().delete_active_game(active_game_res.data);
            return;
        }
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

async function ready_lobby_event(io:TypedIoServer, socket:TypedSocket, sid:string, store:Store){

    const player_res = store.get_player_store().get_player_by_sid(sid);
    if (!player_res.success)
        return await socket.emit('lobby:ready:error', { reason: codeType[player_res.code] });

    lobby_services.ready_player(player_res.data);

    const payload_res = build_lobby_ready_payload(sid, store);
    if (!payload_res.success)
        return await socket.emit('lobby:ready:error', { reason: codeType[payload_res.code] });

    const lobby_res = store.get_lobby_store().get_lobby_by_player_id(player_res.data.get_player_id());
    if (!lobby_res.success)
        return;

    const socket_ids_res = store.get_all_sockets_by_lobby_id(lobby_res.data.get_lobby_id());
    // better: resolve lobby id separately, not owner_id

    await socket.emit('lobby:ready:success', payload_res.data);



    const sockets_res = store.get_all_sockets_by_lobby_id(lobby_res.data.get_lobby_id());
    if (!sockets_res.success)
        return;

    for (const socket_id of sockets_res.data) {
        if (socket_id === socket.id)
            continue;
        await io.to(socket_id).emit('lobby:ready:update', payload_res.data);
    }
}


function build_lobby_ready_payload(sid:string, store:Store): ModelResult<LobbyReadyPayload, CodeType>{

    const player_res = store.get_player_store().get_player_by_sid(sid);
    if(!player_res.success)
        return player_res;

    const lobby_res = store.get_lobby_store().get_lobby_by_player_id(player_res.data.get_player_id());
    if(!lobby_res.success)
        return lobby_res;

    const lobby = lobby_res.data;
    const players = lobby.get_player_ids().map((player_id) => {
        const p_res = store.get_player_store().get_player_by_id(player_id);;
        if(!p_res.success)
            return null;

        const player = p_res.data;

        return {
            player_id,
            username:player.get_username(),
            ready: player.get_player_status() === playerStatusType.ready,
            is_owner: lobby.is_owner(player_id)
        }
    }).filter((player) : player is LobbyPlayerState => player !== null);

    return {
        success:true,
        data:{
            players,
            owner_id: lobby.get_owner_id(),
        }
    }
}