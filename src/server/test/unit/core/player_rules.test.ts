import { 
    calculate_tick_ms,
    calculate_fall_interval_ms,
    should_apply_gravity,
    should_wait_lock_delay,
    can_reset_lock_delay,
    resolve_hold_swap,
 } from "../../../core/player_rules.js";
import { expect_function_pure } from "../../helpers/expect_helpers.test.js";


import { describe, expect, it } from 'vitest';

describe('core: player_rules', () => {
    it('returns tickMs based on levels', () => {
        
        let lock_count = 0, base_tick = 200;
        const tick_0 = expect_function_pure(
            calculate_tick_ms,
            base_tick,
            lock_count,
            true
        );
        expect(tick_0).toEqual(base_tick);

        lock_count = 2;
        const tick_2 = expect_function_pure(
            calculate_tick_ms,
            base_tick,
            lock_count,
            true
        );
        expect(tick_2).toEqual(base_tick - 30);

        lock_count = 100;
        const tick_100 = expect_function_pure(
            calculate_tick_ms,
            base_tick,
            lock_count,
            true
        );
        expect(tick_100).toEqual(100);

        const tick_no_speed = expect_function_pure(
            calculate_tick_ms,
            base_tick,
            lock_count,
            false
        );
        expect(tick_no_speed).toEqual(base_tick);
    });

    it('return fall interval based on dropMultiplier', () => {

        const base_tick = 100
        const interval_drop = expect_function_pure(
            calculate_fall_interval_ms,
            100,
            true,
            0.3,
        );
        expect(interval_drop).toEqual(base_tick * 0.3);

        const interval_no_drop = expect_function_pure(
            calculate_fall_interval_ms,
            100,
            false,
            0.1
        );
        expect(interval_no_drop).toEqual(base_tick)
    });

    it('returns true when gravity should apply', () => {
        const now = 500;
        const should_fall = expect_function_pure(
            should_apply_gravity,
            now,
            400,
            100
        );
        expect(should_fall).toBe(true);

        const should_not_fall = expect_function_pure(
            should_apply_gravity,
            now,
            450,
            100
        );
        expect(should_not_fall).toBe(false);
    });

    it('returns true when lock delay is active', () => {
        const now = 500;
        const lock_delay = 100;

        const is_active = expect_function_pure(
            should_wait_lock_delay,
            now,
            450,
            lock_delay
        );
        expect(is_active).toBe(true);

        const is_unactive = expect_function_pure(
            should_wait_lock_delay,
            now,
            101,
            lock_delay
        );
        expect(is_unactive).toBe(false);

        const no_piece = expect_function_pure(
            should_wait_lock_delay,
            now,
            null,
            100
        );
        expect(no_piece).toBe(false);

        const is_forced = expect_function_pure(
            should_wait_lock_delay,
            now,
            0,
            lock_delay,
            true
        );
        expect(is_forced).toBe(false);
    });

    it('returns true when lock delay can be reset', () => {
        const no_piece = expect_function_pure(
            can_reset_lock_delay,
            null,
            10,
            15
        );
        expect(no_piece).toBe(false);

        const can_reset = expect_function_pure(
            can_reset_lock_delay,
            1,
            5,
            6,
        );
        expect(can_reset).toBe(true);

        const cannot_reset = expect_function_pure(
            can_reset_lock_delay,
            1,
            2,
            1,
        );
        expect(cannot_reset).toBe(false);
    });

    it('resolve hold piece only when allowed', () => {
        const not_allowed = expect_function_pure(
            resolve_hold_swap,
            false,
            false,
            'T',
            null,
        );
        expect(not_allowed).toEqual({
            success: false,
            reason: 'NOT_ALLOWED',
        });

        const already_held = expect_function_pure(
            resolve_hold_swap,
            true,
            true,
            'T',
            null,
        );
        expect(already_held).toEqual({
            success: false,
            reason: 'ONLY_HOLD_ONCE',
        });

        const no_current_piece = expect_function_pure(
            resolve_hold_swap,
            true,
            false,
            null,
            null,
        );
        expect(no_current_piece).toEqual({
            success: false,
            reason: 'PIECE_CANNOT_SPAWN',
        });

        const hold_empty_slot = expect_function_pure(
            resolve_hold_swap,
            true,
            false,
            'T',
            null,
        );
        expect(hold_empty_slot).toEqual({
            success: true,
            next_current_piece: null,
            next_hold_piece: 'T',
            needs_next_piece: true,
        });

        const swap_with_held_piece = expect_function_pure(
            resolve_hold_swap,
            true,
            false,
            'T',
            'I',
        );
        expect(swap_with_held_piece).toEqual({
            success: true,
            next_current_piece: 'I',
            next_hold_piece: 'T',
            needs_next_piece: false,
        });
    });
});