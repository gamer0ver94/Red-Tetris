# Server Game Roadmap




## POUR LE FRONT
- START WITH END GAME -> make a classic first lost only and redirect to lobby
- Rajouter option pour speedOverTime

## Lock Delay

- Extend `PlayerInGame` state with lock data:
  - `touching_ground_since: number | null`
  - `lock_reset_count: number`
  - optional `last_lock_reset_at`
- Add config helpers:
  - `get_lock_delay_ms()`
  - optional `get_max_lock_resets()`
- Change falling behavior:
  - If piece can move down, move it and clear lock timer.
  - If piece cannot move down, start lock timer.
  - Lock only after `lockDelayMs` has elapsed.
- Reset lock delay on valid player movement/rotation while grounded, within the chosen reset limit.
- Hard drop should lock immediately.

## Tick And Piece Lifecycle

- Replace `tick_board(board, player_id, active_game)` with a player-centered function:
  - `tick_player(active_game, player_id, now)`
- Keep one clear lifecycle:
  - spawn next piece if needed
  - apply gravity / lock delay
  - lock piece
  - clear lines
  - apply score
  - apply garbage
  - update visibility
  - check lose/win
- Reset hold availability only after a piece locks or a new piece spawns, whichever rule you choose.
- Ensure spawn failure marks player lost and triggers end-game evaluation.

## Rendering

- Render current piece shape from `RotationProvider` through `Piece.get_shape()`.
- Fill `hold_piece_type` in `RenderPayload`.
- Make invisible grid behavior explicit:
  - own board hidden when `grid.invisible` and reveal timer is off
  - current piece visibility rule decided intentionally
- Keep opponent rendering controlled by `multiplayer.seeOpponents`.

## Scoring

- Decide scoring table for enabled scoring:
  - single
  - double
  - triple
  - tetris
  - optional soft/hard drop points
- Track combo state on `PlayerInGame`.
- Track back-to-back state on `PlayerInGame`.
- Apply options:
  - `scoring.enabled`
  - `scoring.comboBonus`
  - `scoring.backToBackBonus`
- Update `lines` whenever lines clear, even if score is disabled.

## Garbage

- Implement board garbage row insertion.
  - Add rows from bottom.
  - Remove top rows.
  - Decide hole generation.
  - Mark garbage cells as `X`.
- Apply options:
  - `garbage.enabled`
  - `garbage.canClear`
  - `garbage.ratio`
  - `garbage.clearCreateGarbage`
- Decide garbage routing:
  - multiplayer sends garbage to opponents
  - solo ignores or stores pending garbage based on mode
- Decide whether clearing garbage can send garbage back.

## Win And End Game

- Create an end-game service or core helper:
  - `evaluate_game_end(active_game, now)`
  - `finish_game(lobby_id, store, result)`
- Implement win conditions:
  - `survival`: last alive wins, solo ends on player loss
  - `first_lost`: first eliminated player determines result
  - `score`: end when score reaches `win.limit`
  - `lines`: end when lines reaches `win.limit`
  - `time`: end when elapsed time reaches `win.limit`
- Add game start time to `ActiveGame` if `time` condition is used.
- Emit `game:win` and `game:lose` to the right players.
- Stop loop and clean active game/lobby consistently.
- Revisit `leave_game_started`; it currently always stops the game.

## Option Coverage Checklist

- `grid.width`: used by board setup.
- `grid.height`: used by board setup.
- `grid.invisible`: used by render/visibility.
- `grid.revealOnClearMs`: used after clear.
- `pieces.randomSequence`: used by piece provider.
- `pieces.sharedSequence`: used by piece provider.
- `pieces.allowHold`: used by hold service.
- `pieces.nextPreviewCount`: used by render preview.
- `gravity.tickMs`: used by fall timing.
- `gravity.lockDelayMs`: not implemented yet.
- `gravity.softDropMultiplier`: used by fall timing, intentionally slower than regular drop.
- `gravity.fallAfterClear`: used by line clear mode.
- `garbage.enabled`: not implemented yet.
- `garbage.canClear`: not implemented yet.
- `garbage.ratio`: not implemented yet.
- `garbage.clearCreateGarbage`: not implemented yet.
- `scoring.enabled`: not implemented yet.
- `scoring.comboBonus`: not implemented yet.
- `scoring.backToBackBonus`: not implemented yet.
- `win.condition`: not implemented yet.
- `win.limit`: not implemented yet.
- `multiplayer.enabled`: partly represented by lobby/mode behavior.
- `multiplayer.maxPlayers`: used by lobby join.
- `multiplayer.seeOpponents`: used by render.

## Tests To Update Later

- Update tests after lobby/store model changes settle.
- Add focused service tests for:
  - hold
  - SRS rotation kicks
  - lock delay
  - line clear modes
  - scoring
  - garbage
  - end-game evaluation
