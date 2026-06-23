import { describe, expect, it } from 'vitest';

import { expect_function_pure } from '../../helpers/expect_helpers.test.js';
import {
    get_kicks,
    get_prev_rotation,
    get_next_rotation,
    get_shape,
    ROTATION_TABLES,
} from '../../../core/rotation.js';
import type {
    BoardType,
    KickType,
    PieceType,
    RotationType,
} from '../../../types/game_types.js';

describe('core: rotation', () => {

    it('returns the expected shape for every piece and rotation', () => {
        const entries = Object.entries(ROTATION_TABLES) as [
            PieceType,
            Record<RotationType, BoardType>,
        ][];

        for (const [piece_type, rotations] of entries) {
            const rotation_entries = Object.entries(rotations) as [
                `${RotationType}`,
                BoardType,
            ][];

            for (const [rotation_key, expected_shape] of rotation_entries) {
                const rotation = Number(rotation_key) as RotationType;
                const expected_snapshot = expected_shape.map((row) => [...row]);
                const shape = expect_function_pure(get_shape, piece_type, rotation);

                expect(shape).toEqual(expected_snapshot);
                expect(shape).not.toBe(expected_shape);

                for (let y = 0; y < shape.length; y += 1)
                    expect(shape[y]).not.toBe(expected_shape[y]);

                shape[0][0] = 'X';
                expect(ROTATION_TABLES[piece_type][rotation]).toEqual(expected_snapshot);
            }
        }
    });

    it('never returns rotation grater then 3', () => {
        expect(expect_function_pure(get_next_rotation, 0)).toBe(1);
        expect(expect_function_pure(get_next_rotation, 1)).toBe(2);
        expect(expect_function_pure(get_next_rotation, 2)).toBe(3);
        expect(expect_function_pure(get_next_rotation, 3)).toBe(0);

        expect(expect_function_pure(get_prev_rotation, 0)).toBe(3);
        expect(expect_function_pure(get_prev_rotation, 1)).toBe(0);
        expect(expect_function_pure(get_prev_rotation, 2)).toBe(1);
        expect(expect_function_pure(get_prev_rotation, 3)).toBe(2);
    });

    it('returns expected kicks as defensive copies', () => {
        const cases: {
            piece_type: PieceType;
            from: RotationType;
            to: RotationType;
            expected: KickType[];
        }[] = [
            {
                piece_type: 'O',
                from: 0,
                to: 1,
                expected: [[0, 0]],
            },
            {
                piece_type: 'I',
                from: 0,
                to: 1,
                expected: [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
            },
            {
                piece_type: 'I',
                from: 1,
                to: 0,
                expected: [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
            },
            {
                piece_type: 'T',
                from: 0,
                to: 1,
                expected: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
            },
            {
                piece_type: 'L',
                from: 3,
                to: 0,
                expected: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
            },
        ];

        for (const { piece_type, from, to, expected } of cases) {
            const expected_snapshot = expected.map((kick) => [...kick]);
            const kicks = expect_function_pure(get_kicks, piece_type, from, to);

            expect(kicks).toEqual(expected_snapshot);
            expect(kicks).not.toBe(expected);

            for (let i = 0; i < kicks.length; i += 1)
                expect(kicks[i]).not.toBe(expected[i]);

            kicks[0][0] = 99;
            expect(expect_function_pure(get_kicks, piece_type, from, to))
                .toEqual(expected_snapshot);
        }
    });
});
