import { describe, expect, it } from 'vitest';

import { expect_function_pure } from "../../helpers/test.expect_helpers.js";
import {
    resolve_count,
    score_garbage_clear,
    score_garbage_spawn,
    score_line_clear,
} from '../../../core/score.js';

describe('core score', () => {
    it('resolves line clear counts to score types', () => {
        expect(expect_function_pure(resolve_count, 1)).toBe('single');
        expect(expect_function_pure(resolve_count, 2)).toBe('double');
        expect(expect_function_pure(resolve_count, 3)).toBe('triple');
        expect(expect_function_pure(resolve_count, 4)).toBe('tetris');
        expect(expect_function_pure(resolve_count, 8)).toBe('tetris');
    });

    it('scores regular line clears with optional bonus', () => {
        expect(expect_function_pure(score_line_clear, 1000, 0)).toBe(1000);
        expect(expect_function_pure(score_line_clear, 1000, -1)).toBe(1000);
        expect(expect_function_pure(score_line_clear, 1000, 1)).toBe(1100);
        expect(expect_function_pure(score_line_clear, 1000, 2)).toBe(1300);
        expect(expect_function_pure(score_line_clear, 1000, 3)).toBe(1500);
        expect(expect_function_pure(score_line_clear, 1000, 4)).toBe(1800);
        expect(expect_function_pure(score_line_clear, 1000, 4, 3)).toBe(3400);
    });

    it('scores cleared garbage rows with optional bonus', () => {
        expect(expect_function_pure(score_garbage_clear, 1000, 0)).toBe(1000);
        expect(expect_function_pure(score_garbage_clear, 1000, 1)).toBe(1050);
        expect(expect_function_pure(score_garbage_clear, 1000, 4)).toBe(1200);
        expect(expect_function_pure(score_garbage_clear, 1000, 4, 3)).toBe(1600);
    });

    it('penalizes players for received garbage rows', () => {
        expect(expect_function_pure(score_garbage_spawn, 1000, 0)).toBe(1000);
        expect(expect_function_pure(score_garbage_spawn, 1000, 1)).toBe(950);
        expect(expect_function_pure(score_garbage_spawn, 1000, 4)).toBe(800);
    });
});


