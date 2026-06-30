import { describe, expect, it } from 'vitest';

import { ConfigProvider } from '../../../models/config_provider_model.js';
import type { GameOptions } from '../../../types/game_options_types.js';

describe('ConfigProvider', () => {
    it('exposes all configured option values through getters', () => {
        const opts: GameOptions = {
            grid: {
                width: 12,
                height: 24,
                invisible: true,
                revealOnClearMs: 250,
                showLockHighlight: false,
            },
            pieces: {
                randomSequence: false,
                sharedSequence: true,
                allowHold: true,
                nextPreviewCount: 5,
            },
            gravity: {
                tickMs: 700,
                lockDelayMs: 150,
                maxLock: 9,
                softDropMultiplier: 0.4,
                fallAfterClear: false,
                speedOnLock: true,
            },
            garbage: {
                enabled: true,
                canClear: true,
                ratio: 2,
                clearCreateGarbage: true,
            },
            scoring: {
                enabled: true,
                backToBackBonus: true,
            },
            win: {
                condition: 'score',
                limit: 400,
            },
            multiplayer: {
                enabled: true,
                maxPlayers: 6,
                seeOpponents: 'grid',
            },
        };
        const config = new ConfigProvider(opts);

        expect(config.can_hold()).toBe(true);
        expect(config.get_line_clear_mode()).toBe('classic');
        expect(config.get_reveal_on_clear_ms()).toBe(250);
        expect(config.get_boundaries()).toEqual({ width: 12, height: 24 });
        expect(config.is_invisible()).toBe(true);
        expect(config.is_lock_highlight_enabled()).toBe(false);
        expect(config.is_random_sequence()).toBe(false);
        expect(config.is_shared_sequence()).toBe(true);
        expect(config.get_drop_multiplier()).toBe(0.4);
        expect(config.get_tick_ms()).toBe(700);
        expect(config.get_lock_delay_ms()).toBe(150);
        expect(config.get_oppenent_grid_mode()).toBe('grid');
        expect(config.get_preview_count()).toBe(5);
        expect(config.get_win_condition()).toBe('score');
        expect(config.get_win_limit()).toBe(400);
        expect(config.is_speed_on()).toBe(true);
        expect(config.get_max_lock()).toBe(9);
        expect(config.is_score_enable()).toBe(true);
        expect(config.is_back_to_back_enable()).toBe(true);
        expect(config.is_garbage_enabled()).toBe(true);
        expect(config.can_spawn_clearable_garbage()).toBe(true);
        expect(config.get_garbage_ratio()).toBe(2);
        expect(config.is_clear_create_garbage_enabled()).toBe(true);
    });

    it('computes fall interval and cell-gravity mode from gravity settings', () => {
        const opts: GameOptions = {
            grid: {
                width: 10,
                height: 20,
                invisible: false,
                revealOnClearMs: 0,
                showLockHighlight: true,
            },
            pieces: {
                randomSequence: true,
                sharedSequence: false,
                allowHold: false,
                nextPreviewCount: 3,
            },
            gravity: {
                tickMs: 600,
                lockDelayMs: 100,
                maxLock: 15,
                softDropMultiplier: 0.25,
                fallAfterClear: true,
                speedOnLock: false,
            },
            garbage: {
                enabled: false,
                canClear: false,
                ratio: 0,
                clearCreateGarbage: false,
            },
            scoring: {
                enabled: false,
                backToBackBonus: false,
            },
            win: {
                condition: 'survival',
                limit: null,
            },
            multiplayer: {
                enabled: false,
                maxPlayers: 1,
                seeOpponents: 'none',
            },
        };
        const config = new ConfigProvider(opts);

        expect(config.get_line_clear_mode()).toBe('cell_gravity');
        expect(config.get_fall_interval_ms({ soft: false, hard: false })).toBe(600);
        expect(config.get_fall_interval_ms({ soft: true, hard: false })).toBe(150);
        expect(config.get_fall_interval_ms({ soft: false, hard: true })).toBe(0);
    });
});
