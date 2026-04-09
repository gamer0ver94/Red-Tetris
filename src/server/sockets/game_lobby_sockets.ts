import { PlayerStore } from "../stores/players_store.ts";
import { GameStore } from "../stores/games_store.ts";
import type { Server as HttpServer } from 'node:http';

import * as helpers from '../sockets/misc_sockets.ts'
import * as lobby_services from '../services/game_lobby_services.ts'
import { find_me } from "../services/auth_services.js";

export async function socket_game_lobby(
    io:Server,
    socket,
    sid:string,
    players_store:PlayerStore,
    game_store:GameStore,    
){
    socket.on('lobby:join', async() => {
        await join_lobby_event(io, socket, sid, players_store, game_store);
    });

    socket.on('lobby:start', async() => {
        //Check if owner_id triggers 
        //Check if game is full
        //update status
        // triggers start game (game:start)
    });

    socket.on('lobby:leave', async() => {
        //check if game still exist
        //check if player is owner
        //change ownership(lobby:new_owner)
        //remove player from game
        //update status 
    });
}

//MAYBE PASS BY A /event dir ?
export async function join_lobby_event(
    io:Server,
    socket,
    sid:string,
    player_store:PlayerStore,
    game_store:GameStore
    ){
        const player_data = await find_me(sid, player_store);
        if (!player_data)
           return  await socket.emit('lobby:join:error', {reason:'invalid sid'});

        const response = await lobby_services.join_game(
                                                player_data,
                                                socket.data.game_id,
                                                game_store
                                                );
        if (!response.success)
            return await socket.emit('lobby:join_error', {reason:response.reason});
        await helpers.change_player_status(io, 'waiting', sid, player_store);
        await socket.emit('lobby:joined:success', {username:player_data.username});
    }