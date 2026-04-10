import { PlayerStore } from "../stores/players_store.ts";
import { GameStore } from "../stores/games_store.ts";
import { Store } from "../stores/store.ts"
import type { Server as HttpServer } from 'node:http';
import { find_me } from "../services/auth_services.js";

export async function change_player_status(
    io: Server,
    new_status:string,
    sid:string,
    player_store:PlayerStore,
){
    const player_data = await find_me(sid, player_store);
    const socket_id = player_data!.socket_id
    await player_store.set_player_status_by_sid(sid, new_status);
    await io.to(socket_id).emit('player_status:change', {new_status:new_status});
}

export async function change_game_status(
    io: Server,
    new_status:string,
    game_id:string,
    sids:Set<string>,
    store:Store,
){
    const game = await store.get_game_store().get_game_by_id(game_id);
    game!.set_game_status(new_status);
    for (const sid of sids){
        const player_data = await find_me(sid, store.get_player_store())
        io.to(player_data!.socket_id).emit('game_status:change', {new_status:new_status});
    }
}