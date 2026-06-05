# Server Game Roadmap

## Missing / Blocking Stuff

### Garbage

- Implement board garbage insertion.
  - Add garbage rows from bottom.
  - Remove rows from top.
  - Generate one or more holes per garbage row.
  - Mark garbage cells as `X`.
- Apply garbage options.
  - `garbage.enabled`
  - `garbage.canClear`
  - `garbage.ratio`
  - `garbage.clearCreateGarbage`
- Decide garbage routing.
  - Multiplayer sends garbage to opponents.
  - Solo ignores garbage or stores pending garbage depending on mode.
  - Clearing garbage may or may not send garbage back.
- Decide if garbage affects scoring.
  - `ScoreProvider.garbage_clear`
  - `ScoreProvider.garbage_spawn`

### End Game

- Expand `EndGameProvider`.
  - `survival`: last alive wins, solo ends on player loss.
  - `first_lost`: first eliminated player determines result.
  - `score`: end when score reaches `win.limit`.
  - `lines`: end when lines reaches `win.limit`.
  - `time`: end when elapsed time reaches `win.limit`.
- Add game start time to `ActiveGame`.
- Add outcome tie-break rules.
  - Use configured win condition first.
  - If tied, compare score.
  - If score is still tied, allow multiple winners or mark tie explicitly.
  - Even in `first_lost`, `lines`, or `time` modes, score can be computed internally for tie-breaks.
- Create a finish-game service/helper.
  - Stop loop.
  - Compute winners, losers, and ties.
  - Emit `game:win`, `game:lose`, or future `game:tie`.
  - Clean active game/lobby consistently.
- Revisit `leave_game_started`.
  - It currently always stops the game.
  - Later behavior should depend on mode/end condition.

### Game History

- Extend `ScoreProvider` or create a dedicated history provider.
  - Prefer a separate provider if persistence grows beyond scoring.
- Write game outcome records to a JSON file.
  - global game time
  - mode/options summary
  - player username
  - player score
  - win / lose / tie
  - lines cleared
  - end condition
  - timestamp
- Add an HTTP route to read history.
- Add a server-to-client socket event to refresh history after a game ends.
- Decide file location and JSON shape before implementation.

## Small Refactor Plan

### Core Services

- Split `game_core_services.ts` into smaller lifecycle helpers.
  - `tick_player(active_game, player_id, now)`
  - `spawn_next_piece(active_game, player)`
  - `apply_gravity_or_lock_delay(active_game, player, now)`
  - `finish_piece_lock(active_game, player)`
  - `apply_line_clear_effects(active_game, player, clear)`
  - `apply_score_effects(active_game, player, clear)`
  - `apply_garbage_effects(active_game, player, clear)`
- Keep `tick_board` only if it remains a small board-oriented helper.
- Keep player lifecycle order explicit.
  - spawn
  - gravity / lock delay
  - lock
  - clear lines
  - score
  - garbage
  - visibility
  - end-game evaluation

### Loop Services

- Keep `game_loop_services.ts` as orchestration only.
  - loop timers
  - per-player tick scheduling
  - end-game evaluation call
- Move per-player speed calculation into config/speed helper.
- Avoid temporary unused maps or stale variables.

### Providers And Models

- Keep rule calculations in providers.
  - `ScoreProvider`
  - future `GarbageProvider`
  - `EndGameProvider`
  - future history provider
- Keep runtime state in models.
  - `PlayerInGame`: score, lines, combo, back-to-back, lock delay state
  - `ActiveGame`: start time, mode/options, players
- Remove unused helpers/fields once the feature is stable.
  - old uncapped lock reset helper if no longer used
  - dead imports
  - stale comments
  - temporary variables

### Render / Payload Cleanup

- Keep backend and frontend render payload types aligned.
- Send score only when visible scoring should be displayed.
- Optionally keep hidden/internal score server-side for tie-breaks.
- Keep `hold_piece_type`, `next_piece_types`, board, and opponent payload consistently filled.


### FRONTEND

### True SPA 
- always render / not pages 
- block pages aptempt 
- make 404 for unknow routes 
- Add list for games mode + menu for custom
