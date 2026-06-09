import { PlayerStore } from "../stores/players_store.ts";
import { Store } from "../stores/store.ts"
import { find_me } from "../services/auth_services.ts";
import { GameStatus, PlayerStatus } from "../types/status_types.ts";
import type { TypedIoServer } from '../types/socket_event_types.ts';
import { historyPageType } from "../types/history_types.js";


const sock_id_to_page = new Map<string, historyPageType>();

export async function change_player_status(
    io: TypedIoServer,
    new_status:PlayerStatus,
    sid:string,
    player_store:PlayerStore,
){
    const player_res = find_me(sid, player_store);
    if(player_res.success){
        const socket_id = player_res.data.socket_id
        player_store.set_player_status_by_sid(sid, new_status);
        await io.to(socket_id).emit('player_status:change', {new_status:new_status});
    }
}


//TO CHANGE TO LOBBY_STATUS
export async function change_game_status(
    io: TypedIoServer,
    new_status:GameStatus,
    lobby_id:string,
    sids:string[],
    store:Store,
){
    const lobby_res = store.get_lobby_store().get_lobby_by_id(lobby_id);
    if(lobby_res.success){
        lobby_res.data.set_game_status(new_status);
        for (let i = 0; i < sids.length; i ++){
            const player_res = find_me(sids[i], store.get_player_store());
            if(player_res.success && player_res.data.is_known)
                await io.to(player_res.data.socket_id).emit('game_status:change', {new_status:new_status});
        }
    }
}

export  function history_watch(sid:string, page:historyPageType, store:Store):boolean{

    const player_res = store.get_player_store().get_player_by_sid(sid);
    if(!player_res.success)
        return false;
    if(sock_id_to_page.get(player_res.data.get_socket()))
        sock_id_to_page.delete(player_res.data.get_socket());
    sock_id_to_page.set(player_res.data.get_socket(), page);
    return true;
}

export function history_unwatch(sid:string, store:Store):boolean{

    const player_res = store.get_player_store().get_player_by_sid(sid);
    if(!player_res.success)
        return false;
    if(sock_id_to_page.get(player_res.data.get_socket()))
        sock_id_to_page.delete(player_res.data.get_socket());
    return true;
}

export function get_page_for_socket_id(socket_id:string):historyPageType| null{
    return sock_id_to_page.get(socket_id) ?? null;
}

export function get_all_watch_socket_for_page(page:historyPageType):string[]{
    return [...sock_id_to_page.entries()]
    .filter(([, watched]) => watched === page)
    .map(([socket_id]) => socket_id);
}