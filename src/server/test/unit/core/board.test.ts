import { describe, expect, it } from 'vitest';

import {
    can_place_piece,
    clone_board,
    create_empty_board,
    move_if_valid,
    place_piece,
} from '../../../core/board.js';
import { create_piece_state } from '../../../core/piece.js';
import { expect_function_pure } from '../../helpers/test.expect_helpers.js';
import type { BoardType } from '../../../types/game_types.js';

describe('core: board', () => {
    it('creates an empty board with default and custom dimensions', () => {
        expect(expect_function_pure(create_empty_board)).toHaveLength(20);
        expect(expect_function_pure(create_empty_board)[0]).toHaveLength(10);

        expect(expect_function_pure(create_empty_board, 4, 3)).toEqual([
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
        ]);
    });

    it('clones a board deeply', () => {
        const board: BoardType = [
            ['T', '.', '.'],
            ['.', 'X', '.'],
        ];

        const cloned = expect_function_pure(clone_board, board);

        expect(cloned).toEqual(board);
        expect(cloned).not.toBe(board);
        expect(cloned[0]).not.toBe(board[0]);
    });

    it('allows placing a piece inside an empty board or over ghost cells', () => {
        const board = expect_function_pure(create_empty_board, 10, 20);
        const piece = create_piece_state('T');

        expect(expect_function_pure(can_place_piece, board, piece)).toBe(true);

        board[1][3] = 'H';
        board[1][4] = 'H';
        board[1][5] = 'H';

        expect(expect_function_pure(can_place_piece, board, piece)).toBe(true);
    });

    it('rejects placement outside the board bounds', () => {
        const board = expect_function_pure(create_empty_board, 10, 20);

        expect(expect_function_pure(
            can_place_piece,
            board,
            create_piece_state('T', -1, 0),
        )).toBe(false);

        expect(expect_function_pure(
            can_place_piece,
            board,
            create_piece_state('I', 7, 0),
        )).toBe(false);

        expect(expect_function_pure(
            can_place_piece,
            board,
            create_piece_state('T', 3, -1),
        )).toBe(false);

        expect(expect_function_pure(
            can_place_piece,
            board,
            create_piece_state('O', 3, 19),
        )).toBe(false);
    });

    it('rejects placement on locked cells and garbage cells', () => {
        const board = expect_function_pure(create_empty_board, 10, 20);
        const piece = create_piece_state('T', 3, 0);

        board[1][4] = 'X';
        expect(expect_function_pure(can_place_piece, board, piece)).toBe(false);

        board[1][4] = 'J';
        expect(expect_function_pure(can_place_piece, board, piece)).toBe(false);
    });

    it('supports placement checks with movement deltas and explicit rotation', () => {
        const board = expect_function_pure(create_empty_board, 10, 20);
        const piece = create_piece_state('I', 1, 2, 0);

        expect(expect_function_pure(can_place_piece, board, piece, 0, 0, 1)).toBe(true);

        board[4][3] = 'X';
        expect(expect_function_pure(can_place_piece, board, piece, 0, 0, 1)).toBe(false);
        expect(expect_function_pure(can_place_piece, board, piece, 1, 0)).toBe(true);
    });

    it('places a piece on a cloned board without mutating the original', () => {
        const board = expect_function_pure(create_empty_board, 6, 4);
        const piece = create_piece_state('T', 1, 1, 0);

        const placed = place_piece(board, piece);

        expect(placed).toEqual([
            ['.', '.', '.', '.', '.', '.'],
            ['.', '.', 'T', '.', '.', '.'],
            ['.', 'T', 'T', 'T', '.', '.'],
            ['.', '.', '.', '.', '.', '.'],
        ]);
        expect(board).toEqual(create_empty_board(6, 4));
    });

    it('moves a piece only when the target position is valid', () => {
        const board = expect_function_pure(create_empty_board, 10, 20);
        const piece = create_piece_state('T', 3, 0, 0);

        expect(expect_function_pure(move_if_valid, board, piece, -1, 0)).toEqual({
            moved: true,
            piece: {
                type: 'T',
                x: 2,
                y: 0,
                rotation: 0,
            },
        });

        const blocked = create_piece_state('T', 0, 0, 0);
        expect(expect_function_pure(move_if_valid, board, blocked, -1, 0)).toEqual({
            moved: false,
        });
    });
});
