import { afterEach, describe, expect, it, vi } from 'vitest';

import { create_empty_board } from '../../../core/board.js';
import { Board } from '../../../models/board_model.js';
import { PlayerInGame } from '../../../models/player_in_game_model.js';
import type { ClearPhaseState } from '../../../types/render_types.js';

describe('PlayerInGame', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts with default gameplay state', () => {
        const player = new PlayerInGame(new Board(4, 4), 'player-1');

        expect(player.get_player_id()).toBe('player-1');
        expect(player.get_score()).toBe(0);
        expect(player.get_lines()).toBe(0);
        expect(player.is_alive()).toBe(true);
        expect(player.get_hold_piece()).toBeNull();
        expect(player.get_hold()).toBe(false);
        expect(player.get_touching_ground_since()).toBeNull();
        expect(player.is_lock_delay_active()).toBe(false);
        expect(player.get_total_lock()).toBe(0);
        expect(player.get_clear_phase()).toBeNull();
        expect(player.is_clear_phase_active()).toBe(false);
        expect(player.get_bonus()).toBe(1);
        expect(player.is_grid_visible()).toBe(false);
        expect(player.get_gravity()).toMatchObject({
            fall_every_ms: 0,
            soft_drop: false,
            hard_drop: false,
        });
    });

    it('tracks clear phase and hold-piece state', () => {
        const player = new PlayerInGame(new Board(4, 4), 'player-2');
        const phase: ClearPhaseState = {
            mode: 'regular',
            frames: [create_empty_board(2, 2)],
            frame_index: 0,
            next_frame_at: 100,
            final_board: create_empty_board(2, 2),
            cleared_lines: 1,
            cleared_garbage: 0,
        };

        player.set_clear_phase(phase);
        expect(player.get_clear_phase()).toBe(phase);
        expect(player.is_clear_phase_active()).toBe(true);

        player.unset_clear_phase();
        expect(player.get_clear_phase()).toBeNull();
        expect(player.is_clear_phase_active()).toBe(false);

        player.set_hold_piece('I');
        expect(player.get_hold_piece()).toBe('I');

        const shifted = player.shift_hold_piece('T');
        expect(shifted).toBe('I');
        expect(player.get_hold_piece()).toBe('T');
        expect(player.get_hold()).toBe(true);

        player.set_hold_false();
        expect(player.get_hold()).toBe(false);
    });

    it('manages lock delay lifecycle and reset limits', () => {
        const player = new PlayerInGame(new Board(4, 4), 'player-3');

        expect(player.try_reset_lock_delay(1)).toBe(false);

        player.start_lock_delay(100);
        player.start_lock_delay(200);
        expect(player.get_touching_ground_since()).toBe(100);
        expect(player.is_lock_delay_active()).toBe(true);

        expect(player.try_reset_lock_delay(1)).toBe(true);
        expect(player.get_touching_ground_since()).toBeNull();
        expect(player.is_lock_delay_active()).toBe(false);

        player.start_lock_delay(300);
        expect(player.try_reset_lock_delay(1)).toBe(false);
        expect(player.get_touching_ground_since()).toBe(300);

        player.reset_lock_delay();
        expect(player.get_touching_ground_since()).toBeNull();

        player.clear_lock_delay();
        player.start_lock_delay(400);
        expect(player.try_reset_lock_delay(1)).toBe(true);
    });

    it('allows unlimited lock-delay resets when max_try is zero', () => {
        const player = new PlayerInGame(new Board(4, 4), 'player-3b');

        player.start_lock_delay(100);
        expect(player.try_reset_lock_delay(0)).toBe(true);

        player.start_lock_delay(200);
        expect(player.try_reset_lock_delay(0)).toBe(true);
    });

    it('tracks score, lines, life, grid visibility, bonus, and total locks', () => {
        vi.useFakeTimers();
        vi.setSystemTime(1_000);

        const player = new PlayerInGame(new Board(4, 4), 'player-4');

        player.add_lines(3);
        player.set_score(450);
        player.mark_lost();

        expect(player.get_lines()).toBe(3);
        expect(player.get_score()).toBe(450);
        expect(player.is_alive()).toBe(false);

        player.reveal_grid_for(50);
        expect(player.is_grid_visible()).toBe(true);
        vi.setSystemTime(1_049);
        expect(player.is_grid_visible()).toBe(true);
        vi.setSystemTime(1_050);
        expect(player.is_grid_visible()).toBe(false);

        player.reset_bonus();
        expect(player.get_bonus()).toBe(1);
        player.increase_bonus();
        player.increase_bonus();
        expect(player.get_bonus()).toBe(3);

        player.increase_total_lock();
        player.increase_total_lock(2);
        expect(player.get_total_lock()).toBe(3);
    });
});
