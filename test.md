# Test Backlog

## Current state

- Started-game owner leave does not currently promote a new owner.
  - `src/server/services/game_lobby_services.ts:222` removes the player from the active game only.
  - That same started-game branch always returns `new_owner: false`.
  - `src/server/sockets/game_lobby_sockets.ts:170` only emits `lobby:new_owner` when `response.data.new_owner` is true.
- Waiting-lobby ownership transfer exists and is already covered.
  - See `src/server/test/integration/lobby_socket_flow.test.ts:369`.
- Full logout during a started game is a higher-risk case.
  - `src/server/services/auth_services.ts:82` calls `leave_game()` and then deletes the player.
  - If the owner logs out while the game is started, the lobby owner id is not reassigned first.
  - Later lobby status extraction still expects the owner to exist in the player store at `src/server/services/game_lobby_services.ts:335`.
- Open product rule:
  - When a player leaves during a started game, should they leave the active match only?
  - Or should they leave both the active match and the lobby?
  - Current code behaves more like "leave the match only" in memory, but the missing tests sound closer to "leave both match and lobby".

## Direct answer to the owner-leaves question

- Waiting lobby: yes, a new owner is assigned today.
- Started game: no, there is no safe owner transfer path today.
- Started game plus logout: the old owner can become a dangling lobby owner reference.

## Existing integration coverage

- Good coverage already exists for:
  - auth flows
  - game routes
  - history routes
  - socket session and reconnect behavior
  - lobby join/start/leave while waiting
  - gameplay core loop
  - end-game conditions
- Main files already carrying useful coverage:
  - `src/server/test/integration/auth_flow.test.ts`
  - `src/server/test/integration/game_routes_flow.test.ts`
  - `src/server/test/integration/history_flow.test.ts`
  - `src/server/test/integration/socket_session_flow.test.ts`
  - `src/server/test/integration/lobby_socket_flow.test.ts`
  - `src/server/test/integration/gameplay_core_flow.test.ts`
  - `src/server/test/integration/end_game_flow.test.ts`

## Incomplete integration suites

### `src/server/test/integration/leave_playing_flow.test.ts`

- This file is currently only a scaffold.
- Intended scenarios already hinted in the file:
  - leaver is not marked as win or lose
  - remaining player becomes winner in a 2-player started game
  - remaining player can ready and start a new game
  - remaining players stay in the active game when owner leaves in a 3-player started game

### `src/server/test/integration/ready_start_flow.test.ts`

- This file is also still a scaffold.
- Missing scenarios:
  - reject `lobby:ready` when user is not in a lobby
  - confirm `lobby:ready` toggles player state and emits updates to all lobby members
  - reject `lobby:start` when not all players are ready
  - reject `lobby:start` when caller is not host
  - allow `lobby:start` when host starts after everyone is ready

## Important overlap note

- `lobby:start` is already mostly covered in `src/server/test/integration/lobby_socket_flow.test.ts:181`.
- The bigger missing integration gap is not basic start anymore; it is:
  - `lobby:ready` toggle/update behavior
  - started-game leave behavior
  - started-game logout behavior
  - ownership behavior after leave/logout during play

## Missing unit coverage

### `core/` already covered

- `src/server/core/piece_sequence.ts`
- `src/server/core/player_rules.ts`
- `src/server/core/render.ts`
- `src/server/core/rotation.ts`
- `src/server/core/score.ts`

### `core/` still missing dedicated unit suites

- `src/server/core/board.ts`
- `src/server/core/piece.ts`
- `src/server/core/gravity.ts`
- `src/server/core/line_clear.ts`
- `src/server/core/clear_frames.ts`
- `src/server/core/garbage.ts`
- `src/server/core/end_game.ts`

### `models/`, `providers`, and stores still missing dedicated unit suites

- `src/server/models/active_game_model.ts`
- `src/server/models/player_in_game_model.ts`
- `src/server/models/lobby_model.ts`
- `src/server/models/player_model.ts`
- `src/server/models/config_provider_model.ts`
- `src/server/models/piece_provider_model.ts`
- `src/server/models/history_provider.ts`
- `src/server/models/app_error_model.ts`
- `src/server/stores/active_game_store.ts`
- `src/server/stores/lobby_store.ts`
- `src/server/stores/players_store.ts`
- `src/server/stores/store.ts`

## Existing gameplay and end-game integration coverage worth preserving

### `src/server/test/integration/gameplay_core_flow.test.ts`

- Already covers:
  - initial piece appears on game start
  - move left
  - move right
  - soft drop
  - hard drop lock
  - line clear updates board, lines, and score
  - garbage sent to opponents

### `src/server/test/integration/end_game_flow.test.ts`

- Already covers:
  - solo death
  - one player remaining in survival
  - all players dead
  - time limit end
  - score limit end
  - lines limit end
  - tied winners on score

## Recommended implementation order

1. Lock the expected product behavior for started-game leave:
   - leave active match only
   - or leave both active match and lobby
2. Fix started-game leave and logout ownership handling.
3. Implement started-game leave integration tests in this order:
   - owner leaves started 2-player game via `lobby:leave`
   - owner logs out during started 2-player game
   - owner leaves started 3-player game
   - remaining player can ready and restart after win
4. Implement `lobby:ready` integration coverage:
   - reject without lobby
   - toggle ready back and forth
   - broadcast updated player list and `all_ready`
5. Add more gameplay socket coverage:
   - `game:hold`
   - `game:rotate`
   - reconnect during or after play if still relevant
   - history watcher update flow if we want more socket-ish route coverage
6. Finish pure `core/` unit suites.
7. Finish `models/`, `providers`, and store unit suites.

## Test design notes

- `HistoryProvider` will need fs mocking in unit tests.
  - It writes to a hardcoded path: `src/server/models/history_provider.ts:6`.
- `PieceProvider` deserves focused unit coverage because it owns:
  - shared vs per-player sequences
  - random extension on peek
  - index advancement and sequence replacement
- `ConfigProvider` is simple, but it still needs direct tests because many services depend on its option mapping.
- `Store` is important to cover because it is the glue for:
  - socket id lookup
  - sid lookup
  - lobby membership
  - ready checks
  - active game access

## Coverage config note

- `src/server/vitest.config.ts:13` already enforces per-file thresholds:
  - lines: 70
  - statements: 70
  - functions: 70
  - branches: 50
- Once the missing suites are added, the remaining weak files should show up quickly.

## Read-only analysis note

- During the previous pass, Vitest was not run.
- So this document captures structural findings and likely gaps, not the exact current failing test output.
