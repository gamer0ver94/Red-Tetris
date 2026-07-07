import { create_empty_board } from '../../../core/board.js';
import { create_piece_state } from '../../../core/piece.js';
import { describe, expect, it } from 'vitest';
import {
    build_visible_board,
    build_empty_board,
    build_highest_board,
} from '../../../core/render.js';
import { expect_function_pure } from '../../helpers/test.expect_helpers.js';

describe('core: render', () =>{
it('build_visible_board keeps locked cells when no piece exists', () => {
    const board = expect_function_pure(create_empty_board, 4, 6);
    board[1][2] = 'T';

    const result = expect_function_pure(build_visible_board, null, board, true, true);

    expect(result).toEqual(board);
    expect(result).not.toBe(board);
    expect(result[0]).not.toBe(board[0]);
});

it('build_empty_board hides locked cells when no piece exists', () => {
    const board = expect_function_pure(create_empty_board, 4, 6);
    board[1][2] = 'T';

    expect(build_empty_board(null, board, true, true))
        .toEqual(create_empty_board(4, 6));
});

it('overlays ghost first, then visible current piece', () => {
    const board = expect_function_pure(create_empty_board, 6, 8);
    board[6][2] = 'X';

    const piece = expect_function_pure(create_piece_state,'T', 1, 1, 0);

    const result = build_visible_board(piece, board, true, true);

    expect(result[1][2]).toBe('T');
    expect(result[2][1]).toBe('T');
    expect(result[2][2]).toBe('T');
    expect(result[2][3]).toBe('T');

    expect(result.flat().filter((cell) => cell === 'H')).toHaveLength(4);
});

it('does not render current piece when cur_piece_visible is false', () => {
    const board = expect_function_pure(create_empty_board, 6, 8);
    const piece = expect_function_pure(create_piece_state,'T', 1, 1, 0);

    const result = expect_function_pure(build_empty_board, piece, board, false, true);

    expect(result.flat()).not.toContain('T');
    expect(result.flat().filter((cell) => cell === 'H')).toHaveLength(4);
});

it('build_highest_board fills from the first occupied cell in each column', () => {
    const board = expect_function_pure(create_empty_board, 4, 5);
    board[2][1] = 'T';
    board[4][3] = 'X';
    board[1][2] = 'H';

    const result = build_highest_board(null, board, true, true);

    expect(result.map((row) => row[0])).toEqual(['.', '.', '.', '.', '.']);
    expect(result.map((row) => row[1])).toEqual(['.', '.', 'X', 'X', 'X']);
    expect(result.map((row) => row[2])).toEqual(['.', '.', '.', '.', '.']);
    expect(result.map((row) => row[3])).toEqual(['.', '.', '.', '.', 'X']);
});

it('ignores piece cells outside board edges', () => {
    const board = expect_function_pure(create_empty_board, 4, 4);
    const piece = expect_function_pure(create_piece_state, 'T', -1, 1, 0);

    const result = expect_function_pure(
        build_empty_board,
        piece,
        board,
        true,
        false,
    );

    expect(result).toEqual([
        ['.', '.', '.', '.'],
        ['T', '.', '.', '.'],
        ['T', 'T', '.', '.'],
        ['.', '.', '.', '.'],
    ]);
});
    
});