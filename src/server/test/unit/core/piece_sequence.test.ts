import {
    create_piece_sequence,
    peek_piece,
    peek_pieces,
    should_extend_sequence_for_peek,
    advance_piece_sequence,
    RandomInt
} from '../../../core/piece_sequence.js';
import { expect_function_pure } from "../../helpers/expect_helpers.test.js";

import { describe, expect, it } from 'vitest';

describe('core: piece_sequence', () => {

    it('create new piece sequence based on randomInt', () => {
        
        const mock_random_1:RandomInt = (max) => max-1;
        const sequence_1 = create_piece_sequence(mock_random_1);
        expect(sequence_1).toEqual(['I', 'J', 'L', 'S', 'T', 'Z', 'O']);

        const mock_random_0:RandomInt = () => 0;
        const sequence_0 = create_piece_sequence(mock_random_0);
        expect(sequence_0).toEqual(['J', 'L', 'S', 'T', 'Z', 'O', 'I']);
    });

    it('peek next piece based on index', () => {

        const mock_random:RandomInt = () => 0;
        const sequence = create_piece_sequence(mock_random);

        const next_piece = expect_function_pure(
            peek_piece,
            sequence,
            0
        );
        expect(next_piece).toBe('J');

        const no_sequence = expect_function_pure(
            peek_piece,
            [],
            0
        );
        expect(no_sequence).toBe(null);
    });

    it('peek whole sequence based on count and index', () => {
        const mock_random:RandomInt = () => 0;
        const sequence = create_piece_sequence(mock_random);

        const next_sequence = expect_function_pure(
            peek_pieces,
            sequence,
            0,
            3
        );
        expect(next_sequence).toEqual(['J','L','S']);
    });

    it('returns true when sequence needs to extend', () => {

        const no_sequence = expect_function_pure(
            should_extend_sequence_for_peek,
            0,
            0,
            7
        );
        expect(no_sequence).toBe(true);

        const reach_end = expect_function_pure(
            should_extend_sequence_for_peek,
            7,
            7,
            7,
        );
        expect(reach_end).toBe(true);

        const no_extend = expect_function_pure(
            should_extend_sequence_for_peek,
            0,
            7,
            3
        );
        expect(no_extend).toBe(false);
    });

    it('advance piece sequence based on options', () => {
        const next_index = expect_function_pure(
            advance_piece_sequence,
            2,
            7,
            true,
            true,
            ['I', 'T'],
        );
        expect(next_index).toEqual({
            type: 'next_index',
            index: 3,
        });

        const loop_sequence = expect_function_pure(
            advance_piece_sequence,
            6,
            7,
            false,
            true,
            ['I', 'T'],
        );
        expect(loop_sequence).toEqual({
            type: 'loop_sequence',
            index: 0,
        });

        const append_sequence = expect_function_pure(
            advance_piece_sequence,
            6,
            7,
            true,
            true,
            ['I', 'T'],
        );
        expect(append_sequence).toEqual({
            type: 'append_sequence',
            index: 7,
            sequence_to_append: ['I', 'T'],
        });

        const replace_sequence = expect_function_pure(
            advance_piece_sequence,
            6,
            7,
            true,
            false,
            ['I', 'T'],
        );
        expect(replace_sequence).toEqual({
            type: 'replace_sequence',
            index: 0,
            sequence: ['I', 'T'],
        });
    });
});
