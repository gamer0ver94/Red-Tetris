## Current Architecture Contract

core/
  Pure game rules and board projections.
  No mutable state, no classes, no this.
  Board, piece, line clear, gravity, score, garbage, end game, player rules,
  piece sequence, clear frames, render helpers, ghost piece helpers.

models/
  Mutable OOP state holders.
  Classes are allowed here: Player, Piece, Game/ActiveGame, PlayerInGame.
  Board can stay for now as a thin mutable adapter, but it is not required by
  the subject and may be removed later.

providers/
  Optional OOP adapters around core rules.
  Keep only if they make the server-side prototype/OOP architecture clearer.
  Remove or shrink providers that only duplicate core functions.

services/
  Orchestration only.
  Read models/store/config, call core rules, mutate model state, emit/render.
  Avoid hiding game rules here.


## Next Refactor Steps

1. Move render board helpers into core
   - Add core/render_board.ts.
   - Move pure helpers from game_render_services.ts:
     - build_visible_board
     - build_empty_board
     - build_highest_board
   - Keep game_render_services.ts as RenderPayload orchestration only.

2. Add ghost / H projection
   - Add pure helper to compute where the current piece would lock.
   - Render ghost cells as H.
   - Never store H in the real board grid.
   - H must stay collision-empty, as it already does.

3. Clean services after render extraction
   - game_render_services.ts: payload assembly only.
   - game_loop_services.ts: remove stale imports, keep falling/clear phase split.
   - game_core_services.ts: type finish_piece_lock result.
   - Later: remove legacy tick_board clear: 0 result.
   - garbage_services.ts: keep as mutable adapter around core/garbage.ts.

4. Clean models/providers gradually
   - Keep Piece, PlayerInGame, ActiveGame.
   - Keep Board only as a thin adapter until tests are migrated.
   - Review ScoreProvider, RotationProvider, EndGameProvider, PieceProvider.
   - Remove methods/classes only after tests confirm equivalent core coverage.


## Unit Test Plan

Core tests first:
- line_clear
- gravity
- clear_frames
- render_board
- ghost_piece / H projection
- piece_sequence
- player_rules
- end_game
- score
- garbage

Model/provider adapter tests second:
- Board
- Piece
- PieceProvider
- EndGameProvider
- ScoreProvider
- RotationProvider

Service tests last:
- lock starts clear phase
- clear phase finalizes board and rewards
- render payload uses current clear frame
- opponent render uses current clear frame
- garbage is sent after clear phase rewards
- end-game evaluation still works after phase reward application

Goal:
- Unit tests alone should pass the global coverage threshold.
- Integration tests should cover full workflows, not basic pure rules.


## Integration And Manual Checks

- Existing integration tests pass.
- Manual game confirms:
  - regular clear glitches all cleared lines together
  - cell gravity glitches/clears one line at a time
  - rewards/garbage happen after animation phase
  - render and opponent render do not break during clear phase
  - preview pieces match actual upcoming pieces near end of random bag


## Server Serves Frontend

- Build client bundle.
- Fastify serves static client assets.
- Keep API and socket routes registered before frontend fallback.
- Redirect unknown non-API routes to index.html.
- Remove separate client nginx/server path.
- Deploy at school and verify intra build.
