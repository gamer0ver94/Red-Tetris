//Orchestrator

import { Store } from "../stores/store.ts";
import { Game } from "../models/game_model.ts";
import { tick_board } from "./game_core_services.js";

const active_loops = new Map<string, NodeJS.Timeout>();

export async function start_game_loop(
  game_id: string,
  store: Store,
  on_tick: (game: Game) => void | Promise<void>,
  tick_ms = 1000,
) {
  if (active_loops.has(game_id)) {
    return { success: false, reason: 'game loop already running' };
  }

  const game = await store.get_game_store().get_game_by_id(game_id);

  if (!game) {
    return { success: false, reason: 'game not found' };
  }

  let is_ticking = false;

  const timer = setInterval(() => {
    if (is_ticking) return;

    is_ticking = true;

    void Promise.resolve()
      .then(() => tick_game(game))
      .then(() => on_tick(game))
      .finally(() => {
        is_ticking = false;
      });
  }, tick_ms);

  active_loops.set(game_id, timer);

  return { success: true };
}

export function stop_game_loop(game_id: string) {
  const timer = active_loops.get(game_id);

  if (!timer) {
    return false;
  }

  clearInterval(timer);
  active_loops.delete(game_id);

  return true;
}

export function tick_game(game: Game) {
  for (const [id, board ] of game.get_board_map()) {
    tick_board(board, id, game);
  }
}
