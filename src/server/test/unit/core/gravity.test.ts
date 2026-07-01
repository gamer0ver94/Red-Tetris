import { describe, expect, it } from 'vitest';

import { apply_gravity_cell, is_empty_cell } from '../../../core/gravity.js';
import { expect_function_pure } from '../../helpers/test.expect_helpers.js';
import type { BoardType } from '../../../types/game_types.js';

describe('core: gravity', () => {
    it('treats only empty and ghost cells as empty', () => {
        expect(expect_function_pure(is_empty_cell, '.')).toBe(true);
        expect(expect_function_pure(is_empty_cell, 'H')).toBe(true);
        expect(expect_function_pure(is_empty_cell, 'X')).toBe(false);
        expect(expect_function_pure(is_empty_cell, 'T')).toBe(false);
    });

    it('drops piece cells to the lowest reachable empty spot', () => {
        const board: BoardType = [
            ['T', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', 'X', '.'],
            ['.', '.', '.', '.'],
        ];

        expect(expect_function_pure(apply_gravity_cell, board)).toEqual([
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', 'X', '.'],
            ['T', '.', '.', '.'],
        ]);
    });

    it('treats ghost cells as empty while applying gravity', () => {
        const board: BoardType = [
            ['.', 'J', '.', '.'],
            ['.', 'H', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', 'X', '.', '.'],
        ];

        expect(expect_function_pure(apply_gravity_cell, board)).toEqual([
            ['.', '.', '.', '.'],
            ['.', 'H', '.', '.'],
            ['.', 'J', '.', '.'],
            ['.', 'X', '.', '.'],
        ]);
    });

    it('preserves vertical order when multiple piece cells fall in the same column', () => {
        const board: BoardType = [
            ['T', '.', '.'],
            ['J', '.', '.'],
            ['.', '.', '.'],
            ['.', '.', '.'],
        ];

        expect(expect_function_pure(apply_gravity_cell, board)).toEqual([
            ['.', '.', '.'],
            ['.', '.', '.'],
            ['T', '.', '.'],
            ['J', '.', '.'],
        ]);
    });

    it('leaves piece cells in place when they are already blocked', () => {
        const board: BoardType = [
            ['.', '.', '.'],
            ['T', '.', '.'],
            ['X', 'J', '.'],
            ['.', 'X', '.'],
        ];

        expect(expect_function_pure(apply_gravity_cell, board)).toEqual(board);
    });
});
