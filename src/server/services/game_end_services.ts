import { Store } from "../stores/store.ts";
import { Lobby } from "../models/lobby_model.js"
import { stop_game_loop } from "./game_loop_services.js";
import { gameStatusType, playerStatusType } from "../types/status_types.js";
import type { CodeType, ModelResult, FinishGameData } from "../types/error_code_types.js";
import { ActiveGame } from "../models/active_game_model.js";
import { HistoryProvider } from "../models/history_provider.js";
import { HistoryEntry } from "../types/history_types.js";


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

    const history_res = save_history_entries(
        active_game,
        lobby,
        store,
        winner_ids,
        loser_ids
    );
    if(!history_res.success)
        return history_res;
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
            new_entries:history_res.data
        }
    };
}

function save_history_entries(
    active_game:ActiveGame,
    lobby:Lobby,
    store:Store,
    winner_ids:string[],
    loser_ids:string[],
):ModelResult<HistoryEntry[], CodeType>{

    const ended_at = Date.now();
    const end_date = new Date(ended_at).toISOString();
    const total_time = String(ended_at - active_game.get_start_time());
    const is_hidden = !active_game.get_config().is_score_enable();

    const results = [
        ...winner_ids.map((player_id) => ({player_id, is_winner:true})),
        ...loser_ids.map((player_id) => ({ player_id, is_winner:false})),
    ];

    let new_entries:HistoryEntry[] = []; 
    for(const res of results){
        const p_res = store.get_player_store().get_player_by_id(res.player_id);
        const player_res = active_game.get_player(res.player_id)
        if(!p_res.success || !player_res.success)
            continue;

        const entry = {
            username:p_res.data.get_username(),
            is_winner: res.is_winner,
            score:player_res.data.get_score(),
            is_hidden,
            game_mode:lobby.get_game_mode(),
            total_time,
            end_date,
            lobby_id:lobby.get_lobby_id(),
        };
        const saved = HistoryProvider.add_entry(entry);
        if(!saved)
            return {success:false, code:'INTERNAL_ERROR'};
        new_entries.push(entry)
    }
    console.log('[history saved]', new_entries);
    return {success:true, data:new_entries};
}
