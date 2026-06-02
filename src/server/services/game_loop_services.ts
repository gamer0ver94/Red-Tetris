//Orchestrator

import { Store } from "../stores/store.ts";
import { tick_board } from "./game_core_services.js";
import { ActiveGame } from "../models/active_game_model.js";
import { CodeType, ModelResult } from "../types/error_code_types.js";

const active_loops = new Map<string, NodeJS.Timeout>();

export function start_game_loop(
  lobby_id: string,
  store: Store,
  on_tick: (active_game: ActiveGame) => void | Promise<void>
) :ModelResult<null, CodeType>{

  if (active_loops.has(lobby_id))
    return { success: false, code:'ACTIVE_GAME_EXIST' };
  
  const game_res = store.get_active_game_store().get_active_game_by_lobby_id(lobby_id);
  if(!game_res.success)
    return game_res;
  const active_game = game_res.data;

  let is_ticking = false;
  const timer = setInterval(() => {
    if (is_ticking)
      return;
    is_ticking = true;

    void Promise.resolve()
      .then(() => tick_game(active_game))
      .then(() => on_tick(active_game))
      .finally(() => {
        is_ticking = false;
      });
  }, 33);

  active_loops.set(lobby_id, timer);

  return { success: true, data:null };
}

export function stop_game_loop(lobby_id: string):ModelResult<null, CodeType> {
  const timer = active_loops.get(lobby_id);

  if (!timer) {
    return {success:false, code:'TIMER_NOT_FOUND'};
  }

  clearInterval(timer);
  active_loops.delete(lobby_id);

  return {success:true, data:null};
}

export function tick_game(active_game: ActiveGame) {

  const now = Date.now();

  for (const player of active_game.get_players()) {
    if(!player.is_alive())
      continue;

    const gravity = player.get_gravity();
    const ticks_ms = active_game.get_config().get_tick_ms();
    const drop_multiplier = 1 + active_game.get_config().get_drop_multiplier();

    let fall_every_ms:number;
    if(gravity.hard_drop)
      fall_every_ms = 0;
    else if (gravity.soft_drop)
      fall_every_ms = ticks_ms * drop_multiplier;
    else
      fall_every_ms = ticks_ms;
  
    if(now - gravity.last_fall_at >= fall_every_ms){
      tick_board(
        player.get_board(),
        player.get_player_id(),
        active_game,
      );
      gravity.last_fall_at = Date.now();
    }
  }

}
