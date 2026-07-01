import { describe, expect, it } from 'vitest';

import { create_empty_board } from '../../../core/board.js';
import { clear_lines, get_full_lines_indexes } from '../../../core/line_clear.js';
import { expect_function_pure } from '../../helpers/test.expect_helpers.js';
import type { BoardType } from '../../../types/game_types.js';

describe('core: line_clear', () => {
    it('returns indexes for full rows that contain at least one piece cell', () => {
        const board: BoardType = [
            ['X', 'X', 'X', 'X'],
            ['T', 'T', 'T', 'T'],
            ['T', 'H', 'T', 'T'],
            ['J', 'X', 'J', 'X'],
            ['.', 'L', 'L', '.'],
        ];

        expect(expect_function_pure(get_full_lines_indexes, board)).toEqual([1, 3]);
    });

    it('returns a cloned board and zero counters when there is nothing to clear', () => {
        const board = expect_function_pure(create_empty_board, 4, 3);
        board[1][2] = 'T';

        const result = clear_lines(board, []);

        expect(result).toEqual({
            board,
            cleared_lines: 0,
            cleared_garbage: 0,
            cleared_indexes: [],
        });
        expect(result.board).not.toBe(board);
        expect(result.board[0]).not.toBe(board[0]);
    });

    it('clears selected rows, counts garbage separately, and adds empty rows at the top', () => {
        const board: BoardType = [
            ['.', '.', '.', '.'],
            ['T', 'T', 'T', 'T'],
            ['X', 'J', 'X', 'J'],
            ['.', 'L', '.', '.'],
        ];

        const result = clear_lines(board, [1, 2]);

        expect(result).toEqual({
            board: [
                ['.', '.', '.', '.'],
                ['.', '.', '.', '.'],
                ['.', '.', '.', '.'],
                ['.', 'L', '.', '.'],
            ],
            cleared_lines: 1,
            cleared_garbage: 1,
            cleared_indexes: [1, 2],
        });
        expect(board).toEqual([
            ['.', '.', '.', '.'],
            ['T', 'T', 'T', 'T'],
            ['X', 'J', 'X', 'J'],
            ['.', 'L', '.', '.'],
        ]);
    });

    it('honors max by clearing only the last selected indexes', () => {
        const board: BoardType = [
            ['T', 'T', 'T', 'T'],
            ['J', 'J', 'J', 'J'],
            ['.', 'L', '.', '.'],
            ['X', 'S', 'X', 'S'],
        ];

        const result = clear_lines(board, [0, 1, 3], 2);

        expect(result).toEqual({
            board: [
                ['.', '.', '.', '.'],
                ['.', '.', '.', '.'],
                ['T', 'T', 'T', 'T'],
                ['.', 'L', '.', '.'],
            ],
            cleared_lines: 1,
            cleared_garbage: 1,
            cleared_indexes: [1, 3],
        });
        expect(board).toEqual([
            ['T', 'T', 'T', 'T'],
            ['J', 'J', 'J', 'J'],
            ['.', 'L', '.', '.'],
            ['X', 'S', 'X', 'S'],
        ]);
    });
});
