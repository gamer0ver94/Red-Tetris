import { Store } from "../stores/store.ts";
import { Lobby } from "../models/lobby_model.js"
import { stop_game_loop } from "./game_loop_services.js";
import { gameStatusType, playerStatusType } from "../types/status_types.js";
import type { CodeType, ModelResult, FinishGameData } from "../types/error_code_types.js";
import { ActiveGame } from "../models/active_game_model.js";
import { HistoryProvider } from "../models/history_provider.js";


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

function save_history_entries(
    active_game:ActiveGame,
    lobby:Lobby,
    store:Store,
    winner_ids:string[],
    loser_ids:string[],
):ModelResult<boolean, CodeType>{

    let is_winner = true;
    const end_date = Date.now();
    const is_hidden = !active_game.get_config().is_score_enable 
    for(const w_id in winner_ids){
        const p_res = store.get_player_store().get_player_by_id(w_id);
        const player_res = active_game.get_player(w_id);
        if(!player_res.success || !p_res.success)
            continue;
        const new_entry = {
            username:p_res.data.get_username(),
            is_winner,
            score:player_res.data.get_score(),
            is_hidden,
            game_mode:lobby.get_game_mode(),
            total_time: end_date - active_game.get_start_time();
            end_date,
            lobby_id:lobby.get_lobby_id(),
        }
        HistoryProvider.add_entry(new_entry)
    }
    is_winner = false;
}