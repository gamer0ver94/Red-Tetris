import { describe, expect, it } from 'vitest';

import { Board } from '../../../models/board_model.js';
import { Piece } from '../../../models/piece_model.js';
import type { BoardCell, BoardType } from '../../../types/game_types.js';

describe('Board', () => {
    it('creates an empty grid and starts with no current piece', () => {
        const board = new Board(4, 3);

        expect(board.get_board()).toEqual([
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
        ]);
        expect(board.get_current_piece()).toBeNull();
    });

    it('sets and returns the current piece', () => {
        const board = new Board();
        const piece = new Piece('T');

        board.set_current_piece(piece);

        expect(board.get_current_piece()).toBe(piece);
    });

    it('clones incoming grids when setting the board', () => {
        const board = new Board(4, 2);
        const next: BoardType = [
            ['T', '.', '.', '.'],
            ['.', 'X', '.', '.'],
        ];

        board.set_board(next);
        next[0][0] = '.';
        next[1][1] = '.';

        expect(board.get_board()).toEqual([
            ['T', '.', '.', '.'],
            ['.', 'X', '.', '.'],
        ]);
    });

    it('checks whether a piece can be placed inside an empty board', () => {
        const board = new Board(10, 20);

        expect(board.can_place(new Piece('T'))).toBe(true);
    });

    it('allows placement over ghost cells', () => {
        const board = new Board(10, 20);
        board.get_board()[1][3] = 'H';
        board.get_board()[1][4] = 'H';
        board.get_board()[1][5] = 'H';

        expect(board.can_place(new Piece('T', 3, 0))).toBe(true);
    });

    it('rejects placement outside the board bounds', () => {
        const board = new Board(10, 20);

        expect(board.can_place(new Piece('T', -1, 0))).toBe(false);
        expect(board.can_place(new Piece('I', 7, 0))).toBe(false);
        expect(board.can_place(new Piece('T', 3, -1))).toBe(false);
        expect(board.can_place(new Piece('O', 3, 19))).toBe(false);
    });

    it('rejects placement on occupied cells', () => {
        const board = new Board(10, 20);
        board.get_board()[1][4] = 'X';

        expect(board.can_place(new Piece('T', 3, 0))).toBe(false);
    });

    it('moves the current piece horizontally when possible', () => {
        const board = new Board(10, 20);
        const piece = new Piece('T', 3, 0);
        board.set_current_piece(piece);

        expect(board.move_current_piece(-1)).toBe(true);
        expect(piece.get_x()).toBe(2);
    });

    it('does not move when there is no current piece or movement is blocked', () => {
        const board = new Board(10, 20);

        expect(board.move_current_piece(1)).toBe(false);

        const piece = new Piece('T', 0, 0);
        board.set_current_piece(piece);

        expect(board.move_current_piece(-1)).toBe(false);
        expect(piece.get_x()).toBe(0);
    });

    it('ticks down with no piece, movement, and lock states', () => {
        const empty = new Board(10, 20);
        expect(empty.tick_down()).toBe('no_piece');

        const moving = new Board(10, 20);
        const moving_piece = new Piece('O', 3, 0);
        moving.set_current_piece(moving_piece);

        expect(moving.tick_down()).toBe('moved');
        expect(moving_piece.get_y()).toBe(1);

        const locking = new Board(10, 2);
        locking.set_current_piece(new Piece('O', 3, 0));

        expect(locking.tick_down()).toBe('locked');
        expect(locking.get_current_piece()).toBeNull();
        expect(count_cells(locking.get_board(), (cell) => cell === 'O')).toBe(4);
    });

    it('supports custom downward movement in tick_down', () => {
        const board = new Board(10, 20);
        const piece = new Piece('O', 3, 0);
        board.set_current_piece(piece);

        expect(board.tick_down(2)).toBe('moved');
        expect(piece.get_y()).toBe(2);
    });

    it('locks the current piece into the grid', () => {
        const board = new Board(10, 20);
        board.set_current_piece(new Piece('T', 3, 0));

        expect(board.lock_current_piece()).toBeUndefined();
        expect(board.get_current_piece()).toBeNull();
        expect(board.get_board()[0][4]).toBe('T');
        expect(board.get_board()[1][3]).toBe('T');
        expect(board.get_board()[1][4]).toBe('T');
        expect(board.get_board()[1][5]).toBe('T');
    });

    it('returns false when locking without a current piece', () => {
        const board = new Board();

        expect(board.lock_current_piece()).toBe(false);
    });

    it('clears full rows that contain piece cells and preserves garbage-only rows', () => {
        const board = new Board(4, 4);
        replace_grid(board, [
            ['.', '.', '.', '.'],
            ['X', 'X', 'X', 'X'],
            ['T', 'T', 'T', 'T'],
            ['T', 'X', 'T', 'X'],
        ]);

        expect(board.clear_full_rows()).toEqual({
            cleared_lines: 1,
            cleared_garbage: 1,
        });
        expect(board.get_board()).toEqual([
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['X', 'X', 'X', 'X'],
        ]);
    });

    it('keeps incomplete rows when clearing full rows', () => {
        const board = new Board(4, 2);
        replace_grid(board, [
            ['T', 'T', '.', 'T'],
            ['.', '.', '.', '.'],
        ]);

        expect(board.clear_full_rows()).toEqual({
            cleared_lines: 0,
            cleared_garbage: 0,
        });
        expect(board.get_board()).toEqual([
            ['T', 'T', '.', 'T'],
            ['.', '.', '.', '.'],
        ]);
    });

    it('applies cell gravity to piece cells only', () => {
        const board = new Board(4, 4);
        replace_grid(board, [
            ['T', '.', 'X', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
        ]);

        expect(board.apply_cell_gravity()).toBe(true);
        expect(board.get_board()).toEqual([
            ['.', '.', 'X', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['T', '.', '.', '.'],
        ]);
    });

    it('reports no cell gravity movement when piece cells are already blocked', () => {
        const board = new Board(4, 3);
        replace_grid(board, [
            ['.', '.', '.', '.'],
            ['T', '.', '.', '.'],
            ['X', '.', '.', '.'],
        ]);

        expect(board.apply_cell_gravity()).toBe(false);
        expect(board.get_board()).toEqual([
            ['.', '.', '.', '.'],
            ['T', '.', '.', '.'],
            ['X', '.', '.', '.'],
        ]);
    });

    it('clears rows repeatedly while applying cell gravity between clears', () => {
        const board = new Board(4, 4);
        replace_grid(board, [
            ['T', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['I', 'I', 'I', 'I'],
            ['.', 'T', 'T', 'T'],
        ]);

        expect(board.apply_cell_gravity_loop()).toEqual({
            cleared_lines: 2,
            cleared_garbage: 0,
        });
        expect(board.get_board()).toEqual([
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
        ]);
    });

    it('identifies piece cells', () => {
        const board = new Board();

        expect(board.is_piece_cell('T')).toBe(true);
        expect(board.is_piece_cell('.')).toBe(false);
        expect(board.is_piece_cell('X')).toBe(false);
        expect(board.is_piece_cell('H')).toBe(false);
    });
});

function replace_grid(board: Board, next: BoardType): void {
    const grid = board.get_board();
    grid.splice(
        0,
        grid.length,
        ...next.map((row) => [...row]),
    );
}

function count_cells(
    board: BoardType,
    predicate: (cell: BoardCell) => boolean,
): number {
    return board.reduce(
        (total, row) => total + row.filter(predicate).length,
        0,
    );
}
