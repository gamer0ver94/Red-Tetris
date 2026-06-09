import { Store } from "../stores/store.ts";
import { stop_game_loop } from "./game_loop_services.js";
import { gameStatusType, playerStatusType } from "../types/status_types.js";
import type { CodeType, ModelResult, FinishGameData } from "../types/error_code_types.js";


export function finish_active_game(
    lobby_id:string,
    store:Store,
    winner_ids:string[],
    loser_ids:string[]
) : ModelResult<FinishGameData, CodeType>{

    const lobby_res = store.get_lobby_store().get_lobby_by_id(lobby_id)
    if(!lobby_res.success)
        return lobby_res;
    const lobby = lobby_res.data

    const active_game_res = store.get_active_game_store().get_active_game_by_lobby_id(lobby_id);
    if(!active_game_res.success)
        return active_game_res;
    const active_game = active_game_res.data;

    const socket_ids_res = store.get_all_sockets_by_lobby_id(lobby_id);
    if(!socket_ids_res.success)
        return socket_ids_res;
    const socket_ids = socket_ids_res.data;

    const stop_res = stop_game_loop(lobby_id);
    const stopped_loop = stop_res.success;
    lobby.set_game_status(gameStatusType.waiting);

    const delete_res = store.get_active_game_store().delete_active_game(active_game);
    if(!delete_res.success)
        return delete_res;

    return {
        success:true,
        data:{
            lobby_id,
            stopped_loop,
            winner_ids,
            loser_ids,
            socket_ids,

        }
    };
}