import { PlayerStore } from "../stores/players_store.ts";
import { GameStore } from "../stores/games_store.ts";
import { Store } from "../stores/store.ts";
import type { Server as HttpServer } from 'node:http';

import * as helpers from '../sockets/misc_sockets.ts'
import * as lobby_services from '../services/game_lobby_services.ts'
import { find_me } from "../services/auth_services.js";

export async function socket_game_lobby(
    io:Server,
    socket,
    sid:string,
    store:Store,   
){
    const game = await store.get_game_store().get_game_by_id(socket.data.game_id);
    const player = await store.get_player_store().is_known(sid);

    if (!game || ! player)
        return await socket.emit('lobby:error', {reason:'wrong data'});
    socket.on('lobby:join', async() => {
        await join_lobby_event(io, socket, sid, store);
    });

    socket.on('lobby:start', async() => {
        //Check if owner_id triggers
        if (player!.get_player_id() !== game!.get_owner_id())
            await socket.emit('leave:start:error', {reason: `you can't start the game`});
        //Check if game is full
        const response = await lobby_services.start_game(game, store);
        //update status
        const id = game.get_game_id();
        const sids = await store.get_all_sid_by_game_id(id);
        await helpers.change_game_status(io, 'started', id, sids, store);
        for (sid in sids){
            await helpers.change_player_status(io, 'playing', sid, store.get_player_store());
            const socket_id = store.get_player_store().is_known(sid).socket_id; 
        }
    });

    socket.on('lobby:leave', async() => {
        //check if player is alone
        const ids = game.get_player_ids();

        if(ids.size == 1){
            const [id] = ids;
            await store.get_game_store().remove_player_by_id(id, game.get_game_id());
            store.get_game_store().remove_game_by_id(game.get_game_id());
            return await socket.emit('lobby:left', {game:'closed'});
        }
        if (game.get_owner_id() === player.get_player_id()){
            for (const id of ids){
                if (id !== player.get_player_id()){
                     game.set_owner(id);
                     break; 
                }
            }
        }
        //remove player from game
        const response = await store.get_game_store().remove_player_by_id(player.get_player_id(), game.get_game_id());

        if (response !== "success")
            return await socket.emit('lobby:leave:error', {reason:response});
        //update status 
        const sids = await store.get_all_sid_by_game_id(game.get_game_id());
        for (const sid in sids){
            const to_player = await store.get_player_store().is_known(sid);
            await io.to(to_player!.get_socket()).emit('lobby:exit', {message: `${player.get_username} just left the lobby`});
        }
    });
}

//MAYBE PASS BY A /event dir ?
export async function join_lobby_event(
    io:Server,
    socket,
    sid:string,
    store:Store,
    ){
        const player = await store.get_player_store().is_known(sid);
        if (!player)
           return  await socket.emit('lobby:join:error', {reason:'invalid sid'});

        const response = await lobby_services.join_game(
                                                player,
                                                socket.data.game_id,
                                                store.get_game_store()
                                                );
        if (!response.success)
            return await socket.emit('lobby:join_error', {reason:response.reason});
        await helpers.change_player_status(io, 'waiting', sid, store.get_player_store());
        await socket.emit('lobby:joined:success', {username:player.get_username()});
    }