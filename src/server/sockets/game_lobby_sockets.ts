import { Store } from "../stores/store.js";
import * as helpers from '../sockets/misc_sockets.js'
import * as lobby_services from '../services/game_lobby_services.js'
import { gameStatusType, playerStatusType } from "../types/status_types.js";
import type { TypedIoServer, TypedSocket } from '../types/socket_event_types.ts';
import { start_game_loop } from "../services/game_loop_services.js";
import { build_render_payload } from "../services/game_render_services.js";
import { codeType } from "../types/error_code_types.js";
import { LobbyReadyPayload} from '../types/socket_event_types.js';
import { finish_active_game } from "../services/game_end_services.js";
import { HistoryEntry } from "../types/history_types.js";



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

    socket.on('lobby:update', async() => {
        const list = extract_status_list(sid, store);
        if(!list)
            return await socket.emit('lobby:update:error', {reason: 'Error while extracting list'});
        await io.to(socket.id).emit('lobby:update:success', list);
    });

    socket.on('history:watch', async(data) => {
        if(!data)
            return;

        const ok = helpers.history_watch(sid, data, store);
        if(!ok)
            return;
    });

    socket.on('history:unwatch', async() => {
            const ok = helpers.history_unwatch(sid, store);
        if(!ok)
            return;
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
        
        const list = extract_status_list(sid,store);
        if(!list)
            return await socket.emit('lobby:join:error', {reason: 'Error while extracting list'});
        
        if(response.data.socket_ids.length > 0){
            for (const sock of response.data.socket_ids)
                await io.to(sock).emit('lobby:join:update', list );
        }
}

async function start_lobby_event(
    io:TypedIoServer,
    socket:TypedSocket,
    sid:string,
    store:Store
){

    const all_ready = store.are_all_players_ready(sid);
    if(!all_ready.success || !all_ready.data)
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
            const finish_res = finish_active_game(
                game_id,
                store,
                match_results.winners_id,
                match_results.losers_id,
            );

            if(!finish_res.success)
                return;

            await emit_win_lose(
                io,
                store,
                finish_res.data.winner_ids,
                finish_res.data.loser_ids,
                finish_res.data.new_entries,
            );
            
            await emit_history_updates(io, store, finish_res.data.new_entries);

            const random_player_res = store.get_player_store().get_player_by_socket_id(
                finish_res.data.socket_ids[0],
            );

            if(!random_player_res.success)
                return;

            const list = extract_status_list(random_player_res.data.get_sid(), store);
            if(!list)
                return;

            for(const socket_id of finish_res.data.socket_ids)
                await io.to(socket_id).emit('lobby:ready:update', list);

            return;
        }
        for (const sid of sids){
            const player = store.get_player_store().get_player_by_sid(sid);
            if(!player.success)
                continue;
            const payload = build_render_payload(game, player.data.get_player_id(), store);
            if(payload.success){
                await io.to(player.data.get_socket()).emit('game:render', payload.data);
                // console.log("SENDING RENDER")
            }
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
    
    if(response.data.new_owner)
        await io.to(response.data.new_owner_socket).emit('lobby:new_owner');
    
    //send lobby:leave:success to socket + change status(go back to connected)
    await socket.emit('lobby:leave:success');
    await helpers.change_player_status(io, response.data.status, sid, store.get_player_store());

    if(response.data.winner_ids.length > 0 || response.data.loser_ids.length > 0){
        await emit_win_lose(io, store, response.data.winner_ids, response.data.loser_ids, response.data.new_entries);
        await emit_history_updates(io, store, response.data.new_entries,);
    }

    if(response.data.socket_ids.length === 0)
        return;

    const random_player_res = store.get_player_store().get_player_by_socket_id(response.data.socket_ids[0])
    if(!random_player_res.success)
        return;
    const list = extract_status_list(random_player_res.data.get_sid(),store);
    if(!list)
        return await socket.emit('lobby:leave:error', {reason: 'Error while extracting list'});
    for( const socket_id of response.data.socket_ids)
        await io.to(socket_id).emit('lobby:leave:update', list);

}

async function ready_lobby_event(io:TypedIoServer, socket:TypedSocket, sid:string, store:Store){

    const player_res = store.get_player_store().get_player_by_sid(sid);
    if (!player_res.success)
        return await socket.emit('lobby:ready:error', { reason: codeType[player_res.code] });

    const ready_res = lobby_services.ready_player(sid, store);
    if(!ready_res.success)
        return await socket.emit('lobby:ready:error', { reason: codeType[ready_res.code] });

    const status_list = extract_status_list(sid, store);
    if (!status_list)
        return await socket.emit('lobby:ready:error', { reason:'Error while extracting list'});

    await socket.emit('lobby:ready:success');

    const sockets_res = store.get_all_sockets_by_lobby_id(ready_res.data);
    if (!sockets_res.success)
        return;

    for (const socket_id of sockets_res.data)
        await io.to(socket_id).emit('lobby:ready:update', status_list);
}


function extract_status_list(sid:string, store:Store):LobbyReadyPayload|null{

    const player_res = store.get_player_store().get_player_by_sid(sid)
    if(!player_res.success) return null;

    const lobby_res = store.get_lobby_store().get_lobby_by_player_id(player_res.data.get_player_id());
    if(!lobby_res.success) return null;

    const list_res = lobby_services.extract_player_in_lobby_status(lobby_res.data.get_lobby_id(), store);
    if(!list_res.success) return null;

    return list_res.data;
}

export async function emit_win_lose(
    io:TypedIoServer,
    store:Store,
    winner_ids:string[],
    loser_ids:string[],
    new_entries:HistoryEntry[],
) {
    
    for(const id of winner_ids){
        const res = store.get_player_store().get_player_by_id(id);
        if(!res.success)
            continue;
        await io.to(res.data.get_socket()).emit('game:win', new_entries);
        await helpers.change_player_status(io, playerStatusType.waiting, res.data.get_sid(), store.get_player_store());
    }

    for(const id of loser_ids){
        const res = store.get_player_store().get_player_by_id(id);
        if(!res.success)
            continue;
        await io.to(res.data.get_socket()).emit('game:lose', new_entries);
        await helpers.change_player_status(io, playerStatusType.waiting, res.data.get_sid(), store.get_player_store());
    }
}

export async function emit_history_updates(
    io:TypedIoServer,
    store:Store,
    new_entries:HistoryEntry[]
){
    const watched_socket = helpers.get_all_watchers();

    for(const [socket_id, state] of watched_socket){

        const player_res = store.get_player_store().get_player_by_socket_id(socket_id);
        if(!player_res.success)
            continue;
        if(helpers.should_update(state, new_entries, player_res.data.get_username()))
            await io.to(socket_id).emit('history:update');
    }
}
