# Red Tetris TODO

## Current Missing History Wiring

- Keep `history:update` as a simple frontend refetch trigger.
  - Server emits `history:update` with no history payload.
  - Frontend receives it and calls its current HTTP history route again.
  - This avoids duplicating history filtering logic in sockets.

- Finish `save_history_entries(...)`.
  - Place/call it from `finish_active_game()` before deleting `ActiveGame`.
  - Build entries for both `winner_ids` and `loser_ids`.
  - Do not save players who left before the match ended.
  - Convert timestamps to JSON-friendly strings where needed.
    - `end_date`: prefer `new Date().toISOString()`.
    - `total_time`: decide between milliseconds as string or formatted duration.
  - Watch for TypeScript/logic gotchas:
    - Use `for...of` for player ids, not `for...in`.
    - `is_score_enable` is a method; call it if used.
    - `lobby.get_game_mode()` does not currently exist unless added.
    - `HistoryProvider.add_entry(...)` returns `boolean`; decide whether failure should fail `finish_active_game()`.

- Decide exact `HistoryEntry` values.
  - `is_hidden`: likely means score should be hidden for that entry.
  - `game_mode`: derive from lobby options or add a getter to `Lobby`.
  - `score`: use `PlayerInGame.get_score()`.
  - `lobby_id`: use `lobby.get_lobby_id()`.

- Finish socket watch/unwatch.
  - `history:watch` stores `socket_id -> historyPageType`.
  - `history:unwatch` removes the socket from the watch map.
  - Consider unwatching automatically on disconnect.

- Emit `history:update` only where needed.
  - If someone is watching `/win`, emit only when the saved result has at least one winner.
  - If someone is watching `/lose`, emit only when the saved result has at least one loser.
  - If someone is watching `/score` or `/date`, any saved history entry can affect the view.
  - If someone is watching `/lobby`, only emit for matching lobby history once watcher payload tracks `lobby_id`.
  - If someone is watching `/mode`, only emit for matching mode once watcher payload tracks mode.
  - If someone is watching `/users`, only emit for matching username query once watcher payload tracks query.
  - For the first simple version, page-level update is enough:
    - emit to `/win` watchers after wins
    - emit to `/lose` watchers after losses
    - emit to `/score` and `/date` watchers after any saved entry
    - emit to `/me`, `/users`, `/mode`, `/lobby` watchers broadly until watch payloads store more details

## Backend

### History HTTP

- Finish `history_controller.ts`.
  - Keep simple read-only history routes in controllers; no service layer needed for direct `HistoryProvider` reads.
  - Make every history route read `start` / `end` from `Querystring`, not `Params`.
  - Keep default range as `start = 0`, `end = 10`.
  - Revisit `/history/date/:new_first`.
    - Current route uses a boolean path param.
    - Cleaner option: `/history/date?new_first=true&start=0&end=10`.
  - Consider making username search case-insensitive.
  - Fix typo: `UsernameSchearchHistoryData` -> `UsernameSearchHistoryData`.

### History Persistence

- Save history entries when a match ends.
  - Best place: `finish_active_game()`, before deleting the `ActiveGame`.
  - Build one `HistoryEntry` per remaining player in the finished match.
  - Do not save players who left before match end.
  - Use `winner_ids` / `loser_ids` to set `is_winner`.
  - Include:
    - `lobby_id`
    - `username`
    - `is_winner`
    - `score`
    - `is_hidden`
    - `game_mode`
    - `total_time`
    - `end_date`
  - Keep `history.json` complete; pagination must only happen on read.

### History Sockets

- Add socket events for live history refresh.
  - Client-to-server:
    - `history:watch`
    - `history:unwatch`
  - Server-to-client:
    - `history:update`
- Store current history watch state by socket id.
  - Example watch types:
    - `me`
    - `users`
    - `mode`
    - `date`
    - `score`
    - `lobby`
    - `win`
    - `lose`
  - Include `start` / `end` in the watch payload.
- After saving history:
  - Check active watchers.
  - Skip sockets that are currently in game if desired.
  - Emit `history:update` only to sockets whose watched view could change.
  - First implementation can send an empty update event and let the frontend refetch.

### End Game

- Keep `finish_active_game()` as the single backend cleanup path.
  - Stop loop.
  - Set lobby status back to waiting.
  - Save history.
  - Delete active game.
  - Return socket ids and winner/loser ids.
- Keep leavers excluded from win/lose/history when they leave before match end.
- Re-check solo/all-dead edge cases after typecheck.

### Compliance / Tests

- Restore backend typecheck.
- Update stale tests after behavior stabilizes.
- Reach subject coverage targets:
  - 70% statements/functions/lines.
  - 50% branches.

## Frontend

### History UI

- Add pages/views for history routes.
  - `/history/me`
  - `/history/users/:query`
  - `/history/mode/:mode`
  - `/history/date`
  - `/history/score`
  - `/history/lobby/:lobby_id`
  - `/history/win`
  - `/history/lose`
- Use query params for pagination:
  - `?start=0&end=10`
  - `?start=10&end=20`
- For live updates:
  - Emit `history:watch` when entering a history view.
  - Emit `history:unwatch` when leaving it.
  - On `history:update`, refetch the current history route.

### Lobby / Game Updates From Today

- Ensure frontend consumes full lobby update payloads consistently:
  - `lobby:join:update`
  - `lobby:ready:update`
  - `lobby:leave:update`
- Treat update events as full state replacement:
  - `players`
  - `owner_name`
  - `all_ready`
- Make sure game end returns players to lobby visually after:
  - natural match end
  - leave-caused match end

### SPA / Routing

- Confirm the client is a true SPA.
  - Browser should load one HTML document.
  - Route changes should be handled client-side.
  - Direct refresh on nested routes should still serve the SPA entry.
- Verify the subject URL requirement:
  - Expected shape: `/<room>/<player_name>`.
  - Current app routes should either match this or intentionally map it to register/join flow.

### Subject Compliance Risks

- SVG risk:
  - `src/client/public/favicon.svg`
  - `src/client/public/icons.svg`
  - `src/client/index.html` references `/favicon.svg`
- The subject says SVG is prohibited.
  - Decide whether to replace SVG assets with PNG/ICO or remove them.
  - Generated docs may contain SVG/table markup, but gameplay/client assets are the higher-risk area.
- Canvas/table:
  - Re-scan client before final submission for `<canvas>`, `<table>`, and direct DOM manipulation.

### Frontend Tests

- Add/update tests after backend event shapes settle.
- Verify frontend still builds after history routes and socket events are added.
