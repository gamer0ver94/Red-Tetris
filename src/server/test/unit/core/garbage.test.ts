import { describe, expect, it } from 'vitest';

import {
    add_garbage_rows,
    create_garbage_row,
    resolve_garbage_send_back,
    resolve_garbage_to_send,
} from '../../../core/garbage.js';
import { expect_function_pure } from '../../helpers/expect_helpers.test.js';
import type { BoardType } from '../../../types/game_types.js';

describe('core: garbage', () => {
    it('resolves outgoing garbage from cleared lines and ratio', () => {
        expect(expect_function_pure(resolve_garbage_to_send, 0, 1)).toBe(0);
        expect(expect_function_pure(resolve_garbage_to_send, -1, 1)).toBe(0);
        expect(expect_function_pure(resolve_garbage_to_send, 1, 0)).toBe(1);
        expect(expect_function_pure(resolve_garbage_to_send, 2, 1)).toBe(1);
        expect(expect_function_pure(resolve_garbage_to_send, 4, 1.5)).toBe(2);
        expect(expect_function_pure(resolve_garbage_to_send, 1, 3)).toBe(0);
    });

    it('resolves garbage send-back only when enabled and positive', () => {
        expect(expect_function_pure(resolve_garbage_send_back, 0, 0, true)).toBe(0);
        expect(expect_function_pure(resolve_garbage_send_back, 2, 0, false)).toBe(0);
        expect(expect_function_pure(resolve_garbage_send_back, 2, 0, true)).toBe(2);
        expect(expect_function_pure(resolve_garbage_send_back, 4, 1.5, true)).toBe(2);
        expect(expect_function_pure(resolve_garbage_send_back, 1, 3, true)).toBe(0);
    });

    it('creates a garbage row with a single hole when hole_pos is provided', () => {
        expect(expect_function_pure(create_garbage_row, 5, 2)).toEqual([
            'X',
            'X',
            '.',
            'X',
            'X',
        ]);
    });

    it('creates an uncleareable garbage row when no hole position is provided', () => {
        expect(expect_function_pure(create_garbage_row, 4, null)).toEqual([
            'X',
            'X',
            'X',
            'X',
        ]);
    });

    it('returns a cloned board when rows is zero or the board is empty', () => {
        const board: BoardType = [
            ['.', '.', '.'],
            ['T', '.', '.'],
        ];

        const unchanged = add_garbage_rows(board, 0, true, () => 0);

        expect(unchanged).toEqual(board);
        expect(unchanged).not.toBe(board);
        expect(unchanged[0]).not.toBe(board[0]);

        expect(add_garbage_rows([], 2, true, () => 0)).toEqual([]);
        expect(add_garbage_rows([[]], 2, true, () => 0)).toEqual([[]]);
    });

    it('pushes clearable garbage rows with a deterministic shared hole', () => {
        const board: BoardType = [
            ['T', '.', '.'],
            ['J', '.', '.'],
            ['L', '.', '.'],
        ];
        const snapshot = board.map((row) => [...row]);

        const result = add_garbage_rows(board, 2, true, () => 1);

        expect(result).toEqual([
            ['L', '.', '.'],
            ['X', '.', 'X'],
            ['X', '.', 'X'],
        ]);
        expect(board).toEqual(snapshot);
    });

    it('pushes uncleareable garbage rows when can_clear is false', () => {
        const board: BoardType = [
            ['.', '.', '.'],
            ['T', '.', '.'],
            ['J', '.', '.'],
        ];

        const result = add_garbage_rows(board, 1, false, () => 2);

        expect(result).toEqual([
            ['T', '.', '.'],
            ['J', '.', '.'],
            ['X', 'X', 'X'],
        ]);
        expect(board).toEqual([
            ['.', '.', '.'],
            ['T', '.', '.'],
            ['J', '.', '.'],
        ]);
    });
});
