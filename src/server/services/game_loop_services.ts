//Orchestrator

import { Store } from "../stores/store.ts";
import { apply_clear_rewards, tick_board } from "./game_core_services.js";
import { ActiveGame } from "../models/active_game_model.js";
import { CodeType, ModelResult } from "../types/error_code_types.js";
import { PlayerInGame, PlayerGravityState } from "../models/player_in_game_model.js";
import {
  calculate_fall_interval_ms,
  calculate_tick_ms,
  should_apply_gravity,
} from "../core/player_rules.js";
import {advance_phase_state, is_clear_phase_done} from "../core/clear_frames.js"
import { evaluate_active_end_game } from "./game_end_services.js";


const active_loops = new Map<string, NodeJS.Timeout>();

export function start_game_loop(
  lobby_id: string,
  store: Store,
  on_tick: (active_game: ActiveGame, match_results: {winners_id: string[], losers_id: string[]} | null) => void | Promise<void>
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
      .then(async (match_results) => {
        if(match_results)
            stop_game_loop(lobby_id);
        await on_tick(active_game, match_results);
      })
      .finally(() => {
        is_ticking = false;
      });
  }, 30);

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

export function tick_game(active_game: ActiveGame) : {winners_id:string[], losers_id:string[]} | null{

  const now = Date.now();
    for (const player of active_game.get_players())
      advance_player_tick(active_game, player, now);
  return evaluate_match_end(active_game);
}

function advance_player_tick(
  active_game:ActiveGame,
  player:PlayerInGame,
  now:number
){
  if(!player.is_alive())
    return;
  if(player.is_clear_phase_active())
    advance_player_clear_phase(player, active_game, now);
  else
    advance_player_falling_phase(active_game, player, now);
}

function advance_player_falling_phase(
  active_game:ActiveGame,
  player:PlayerInGame,
  now:number
){
  const gravity = player.get_gravity();

  if(gravity.hard_drop && player.get_board().get_current_piece()){
    instant_lock(player, gravity, active_game);
    return;
  }

  const gravity_due = is_player_gravity_due(active_game, player, now);
  const lock_check_due = player.is_lock_delay_active();
  if(!gravity_due && !lock_check_due)
    return;

  const tick_res = tick_board(
    player.get_board(),
    player.get_player_id(),
    active_game,
    now,
    gravity_due
  );
  if (tick_res.success && gravity_due && !tick_res.data.lock_waiting)
    gravity.last_fall_at = now;
}


function is_player_gravity_due(
  active_game:ActiveGame,
  player:PlayerInGame,
  now:number,
):boolean{
  const gravity = player.get_gravity();
  const ticks_ms = get_player_tick_ms(active_game, player);

  const fall_every_ms = calculate_fall_interval_ms(
    ticks_ms,
    gravity.soft_drop,
    active_game.get_config().get_drop_multiplier(),
  );
  return should_apply_gravity(now, gravity.last_fall_at, fall_every_ms);
}

function get_player_tick_ms(active_game:ActiveGame, player:PlayerInGame):number{

  const base = active_game.get_config().get_tick_ms();
  const locks = player.get_total_lock();
  return calculate_tick_ms(base, locks, active_game.get_config().is_speed_on());
}

function instant_lock(player:PlayerInGame, gravity:PlayerGravityState, active_game:ActiveGame){
  let guard = player.get_board().get_board().length + 5;

    while (guard > 0 && player.get_board().get_current_piece()) {
        const tick_res = tick_board(
            player.get_board(),
            player.get_player_id(),
            active_game,
            Date.now(),
            true,
            true,
        );

        if (!tick_res.success)
            break;

        if (tick_res.data.lock_waiting)
            break;

        guard -= 1;
    }

    gravity.hard_drop = false;
    gravity.last_fall_at = Date.now();
}

const CLEAR_FRAME_MS = 70;

function advance_player_clear_phase(
    player: PlayerInGame,
    active_game: ActiveGame,
    now: number,
): void {
    const phase = player.get_clear_phase();

    if (!phase)
        return;

    if (now < phase.next_frame_at)
        return;

    const next_phase = advance_phase_state(phase, now, CLEAR_FRAME_MS);

    if (!is_clear_phase_done(next_phase)) {
        player.set_clear_phase(next_phase);
        return;
    }

    player.get_board().set_board(phase.final_board);
    player.unset_clear_phase();

    apply_clear_rewards(active_game, player, phase.cleared_lines, phase.cleared_garbage);
}

function evaluate_match_end(active_game:ActiveGame){
  const end_res = evaluate_active_end_game(active_game);

  if(!end_res.finished)
    return null;
  return {
    winners_id:end_res.winners_id!,
    losers_id:end_res.losers_id!,
  }
}
