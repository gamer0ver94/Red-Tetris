# Game Options Frontend Ranges

These ranges are intended for frontend controls when creating a custom game. They should keep custom games playable while still allowing unusual modes.

## grid

| Option | Type | Suggested control | Suggested range / values | Default-friendly value |
| --- | --- | --- | --- | --- |
| `width` | number | stepper / number input | `6` to `20` cells | `10` |
| `height` | number | stepper / number input | `12` to `30` cells | `20` |
| `invisible` | boolean | toggle | `true` / `false` | `false` |
| `revealOnClearMs` | number | slider / number input | `0` to `2000` ms | `0` |

## pieces

| Option | Type | Suggested control | Suggested range / values | Default-friendly value |
| --- | --- | --- | --- | --- |
| `randomSequence` | boolean | toggle | `true` / `false` | `true` |
| `sharedSequence` | boolean | toggle | `true` / `false` | `true` |
| `allowHold` | boolean | toggle | `true` / `false` | `true` |
| `nextPreviewCount` | number | stepper / slider | `0` to `7` pieces | `3` |

## gravity

| Option | Type | Suggested control | Suggested range / values | Default-friendly value |
| --- | --- | --- | --- | --- |
| `tickMs` | number | slider | `100` to `1200` ms | `650` |
| `lockDelayMs` | number | slider | `0` to `1000` ms | `100` |
| `maxLock` | number | stepper / slider | `0` to `30` resets | `15` |
| `softDropMultiplier` | number | slider | `0.1` to `1` | `0.3` |
| `fallAfterClear` | boolean | toggle | `true` / `false` | `true` |
| `speedOnLock` | boolean | toggle | `true` / `false` | `true` |

Note: current presets use `softDropMultiplier` values below `1`, so the route schema should allow decimals below `1` if the frontend exposes the same behavior.

## garbage

| Option | Type | Suggested control | Suggested range / values | Default-friendly value |
| --- | --- | --- | --- | --- |
| `enabled` | boolean | toggle | `true` / `false` | `true` |
| `canClear` | boolean | toggle | `true` / `false` | `true` |
| `ratio` | number | segmented control / slider | `0` to `4` | `1` |
| `clearCreateGarbage` | boolean | toggle | `true` / `false` | `false` |

`ratio` controls how many cleared lines are needed to create garbage. `0` is very aggressive. Higher values make garbage less frequent.

## scoring

| Option | Type | Suggested control | Suggested range / values | Default-friendly value |
| --- | --- | --- | --- | --- |
| `enabled` | boolean | toggle | `true` / `false` | `true` |
| `backToBackBonus` | boolean | toggle | `true` / `false` | `true` |

If scoring is disabled, score should be hidden in history entries.

## win

| Option | Type | Suggested control | Suggested range / values | Default-friendly value |
| --- | --- | --- | --- | --- |
| `condition` | enum | select | `survival`, `first_lost`, `score`, `lines`, `time` | `survival` |
| `limit` | number or null | conditional input | depends on `condition` | `null` |

Suggested `limit` ranges by condition:

| Condition | Suggested limit |
| --- | --- |
| `survival` | `null` |
| `first_lost` | `null` |
| `score` | `1000` to `100000` |
| `lines` | `1` to `200` |
| `time` | `30000` to `1800000` ms |

## multiplayer

| Option | Type | Suggested control | Suggested range / values | Default-friendly value |
| --- | --- | --- | --- | --- |
| `enabled` | boolean | toggle | `true` / `false` | `true` |
| `maxPlayers` | number or null | stepper / number input | `1` to `10`, or `null` for uncapped | `null` |
| `seeOpponents` | enum | segmented control / select | `full`, `grid`, `highest`, `none` | `highest` |

Recommended UI behavior:

- If `multiplayer.enabled` is `false`, force `maxPlayers` to `1`, `garbage.enabled` to `false`, and `seeOpponents` to `none`.
- If `garbage.enabled` is `false`, disable `canClear`, `ratio`, and `clearCreateGarbage` controls.
- If `grid.invisible` is `false`, disable or hide `revealOnClearMs`.
- If `win.condition` is `survival` or `first_lost`, use `limit: null`.
