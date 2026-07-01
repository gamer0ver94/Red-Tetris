import { describe, expect, it } from 'vitest';

import {
    create_piece_state,
    get_piece_cells,
    is_piece_cell,
    move_piece,
    rotate_piece,
} from '../../../core/piece.js';
import { expect_function_pure } from '../../helpers/test.expect_helpers.js';

describe('core: piece', () => {
    it('identifies piece cells and excludes empty, garbage, and ghost cells', () => {
        expect(expect_function_pure(is_piece_cell, 'T')).toBe(true);
        expect(expect_function_pure(is_piece_cell, 'O')).toBe(true);
        expect(expect_function_pure(is_piece_cell, '.')).toBe(false);
        expect(expect_function_pure(is_piece_cell, 'X')).toBe(false);
        expect(expect_function_pure(is_piece_cell, 'H')).toBe(false);
    });

    it('creates piece state with defaults and custom overrides', () => {
        expect(expect_function_pure(create_piece_state, 'T')).toEqual({
            type: 'T',
            x: 3,
            y: 0,
            rotation: 0,
        });

        expect(expect_function_pure(create_piece_state, 'L', 4, 7, 2)).toEqual({
            type: 'L',
            x: 4,
            y: 7,
            rotation: 2,
        });
    });

    it('moves piece state without mutating the original value', () => {
        const piece = create_piece_state('J', 1, 2, 3);

        expect(expect_function_pure(move_piece, piece, 3, 4)).toEqual({
            type: 'J',
            x: 4,
            y: 6,
            rotation: 3,
        });
        expect(piece).toEqual({
            type: 'J',
            x: 1,
            y: 2,
            rotation: 3,
        });
    });

    it('rotates piece state to the next rotation by default', () => {
        const piece = create_piece_state('I', 3, 0, 0);

        expect(expect_function_pure(rotate_piece, piece)).toEqual({
            type: 'I',
            x: 3,
            y: 0,
            rotation: 1,
        });
        expect(piece.rotation).toBe(0);
    });

    it('can rotate piece state to an explicit rotation', () => {
        const piece = create_piece_state('S', 2, 5, 1);

        expect(expect_function_pure(rotate_piece, piece, 3)).toEqual({
            type: 'S',
            x: 2,
            y: 5,
            rotation: 3,
        });
        expect(piece.rotation).toBe(1);
    });

    it('returns occupied cells for the current rotation and position', () => {
        const piece = create_piece_state('T', 2, 5, 0);

        expect(expect_function_pure(get_piece_cells, piece)).toEqual([
            { x: 3, y: 5, type: 'T' },
            { x: 2, y: 6, type: 'T' },
            { x: 3, y: 6, type: 'T' },
            { x: 4, y: 6, type: 'T' },
        ]);
    });

    it('can read cells for another rotation without mutating current rotation', () => {
        const piece = create_piece_state('I', 1, 2, 0);

        expect(expect_function_pure(get_piece_cells, piece, 1)).toEqual([
            { x: 3, y: 2, type: 'I' },
            { x: 3, y: 3, type: 'I' },
            { x: 3, y: 4, type: 'I' },
            { x: 3, y: 5, type: 'I' },
        ]);
        expect(piece.rotation).toBe(0);
    });
});
