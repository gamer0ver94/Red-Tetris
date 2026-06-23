import { describe, expect, it } from 'vitest';

import { Piece } from '../../../models/piece_model.js';

describe('Piece', () => {
    it('stores type and default position', () => {
        const piece = new Piece('T');

        expect(piece.get_type()).toBe('T');
        expect(piece.get_x()).toBe(3);
        expect(piece.get_y()).toBe(0);
        expect(piece.get_rotation()).toBe(0);
        expect(piece.get_next_rotation()).toBe(1);
    });

    it('accepts a custom position', () => {
        const piece = new Piece('O', 4, 7);

        expect(piece.get_type()).toBe('O');
        expect(piece.get_x()).toBe(4);
        expect(piece.get_y()).toBe(7);
    });

    it('updates position with setters and relative movement', () => {
        const piece = new Piece('L');

        piece.set_x(1);
        piece.set_y(2);
        piece.move_by(3, 4);

        expect(piece.get_x()).toBe(4);
        expect(piece.get_y()).toBe(6);
    });

    it('rotates through all four states', () => {
        const piece = new Piece('I');

        piece.add_rotation();
        expect(piece.get_rotation()).toBe(1);
        expect(piece.get_next_rotation()).toBe(2);

        piece.add_rotation();
        piece.add_rotation();
        piece.add_rotation();

        expect(piece.get_rotation()).toBe(0);
        expect(piece.get_next_rotation()).toBe(1);
    });

    it('returns occupied cells for current rotation and position', () => {
        const piece = new Piece('T', 2, 5);

        expect(piece.get_cells()).toEqual([
            { x: 3, y: 5, type: 'T' },
            { x: 2, y: 6, type: 'T' },
            { x: 3, y: 6, type: 'T' },
            { x: 4, y: 6, type: 'T' },
        ]);
    });

    it('can read cells for another rotation without mutating current rotation', () => {
        const piece = new Piece('I', 1, 2);

        expect(piece.get_cells(1)).toEqual([
            { x: 3, y: 2, type: 'I' },
            { x: 3, y: 3, type: 'I' },
            { x: 3, y: 4, type: 'I' },
            { x: 3, y: 5, type: 'I' },
        ]);
        expect(piece.get_rotation()).toBe(0);
    });

    it('returns rotated shapes', () => {
        const piece = new Piece('O');

        expect(piece.get_shape()).toEqual([
            ['.', 'O', 'O', '.'],
            ['.', 'O', 'O', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
        ]);
        expect(piece.get_shape(2)).toEqual(piece.get_shape());
    });
});
