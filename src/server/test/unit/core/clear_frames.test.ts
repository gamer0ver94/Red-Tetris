import { describe, expect, it } from 'vitest';

import { create_empty_board } from '../../../core/board.js';
import {
    advance_phase_state,
    create_cell_gravity_clear_phase,
    create_clear_phase,
    create_regular_clear_phase,
    get_current_phase_frame,
    is_clear_phase_done,
} from '../../../core/clear_frames.js';
import { expect_function_pure } from '../../helpers/expect_helpers.test.js';
import type { BoardType } from '../../../types/game_types.js';

describe('core: clear_frames', () => {
    it('returns null when there are no clearable lines', () => {
        const board = expect_function_pure(create_empty_board, 4, 4);
        board[2][1] = 'T';

        expect(expect_function_pure(
            create_clear_phase,
            board,
            'regular',
            100,
            50,
        )).toBeNull();

        expect(expect_function_pure(
            create_clear_phase,
            board,
            'cell_gravity',
            100,
            50,
        )).toBeNull();
    });

    it('creates regular clear phases with blink frames followed by the cleared board', () => {
        const board: BoardType = [
            ['O', '.', '.', '.'],
            ['T', 'T', 'T', 'T'],
            ['X', 'J', 'X', 'J'],
            ['.', 'L', '.', '.'],
        ];

        const phase = create_regular_clear_phase(board, 100, 25);

        expect(phase).not.toBeNull();
        if (!phase)
            throw new Error('Expected regular clear phase');

        expect(phase.mode).toBe('regular');
        expect(phase.frame_index).toBe(0);
        expect(phase.next_frame_at).toBe(125);
        expect(phase.cleared_lines).toBe(1);
        expect(phase.cleared_garbage).toBe(1);
        expect(phase.frames).toHaveLength(11);
        expect(phase.frames[0]).toEqual(board);
        expect(phase.frames[1]).toEqual([
            ['O', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', 'L', '.', '.'],
        ]);
        expect(phase.final_board).toEqual([
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['O', '.', '.', '.'],
            ['.', 'L', '.', '.'],
        ]);
        expect(phase.frames[10]).toEqual(phase.final_board);
        expect(board).toEqual([
            ['O', '.', '.', '.'],
            ['T', 'T', 'T', 'T'],
            ['X', 'J', 'X', 'J'],
            ['.', 'L', '.', '.'],
        ]);
    });

    it('creates cell gravity phases that clear one line at a time and reapply gravity', () => {
        const board: BoardType = [
            ['T', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['I', 'I', 'I', 'I'],
            ['.', 'T', 'T', 'T'],
        ];

        const phase = create_cell_gravity_clear_phase(board, 100, 25);

        expect(phase).not.toBeNull();
        if (!phase)
            throw new Error('Expected cell gravity clear phase');

        expect(phase.mode).toBe('cell_gravity');
        expect(phase.frame_index).toBe(0);
        expect(phase.next_frame_at).toBe(125);
        expect(phase.cleared_lines).toBe(2);
        expect(phase.cleared_garbage).toBe(0);
        expect(phase.frames).toHaveLength(24);
        expect(phase.frames[10]).toEqual([
            ['.', '.', '.', '.'],
            ['T', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', 'T', 'T', 'T'],
        ]);
        expect(phase.frames[11]).toEqual([
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['T', 'T', 'T', 'T'],
        ]);
        expect(phase.frames[23]).toEqual([
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
        ]);
        expect(phase.final_board).toEqual([
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
        ]);
        expect(board).toEqual([
            ['T', '.', '.', '.'],
            ['.', '.', '.', '.'],
            ['I', 'I', 'I', 'I'],
            ['.', 'T', 'T', 'T'],
        ]);
    });

    it('advances phase state without mutating the original phase', () => {
        const phase = create_regular_clear_phase([
            ['T', 'T', 'T', 'T'],
            ['.', '.', '.', '.'],
        ], 100, 25);

        expect(phase).not.toBeNull();
        if (!phase)
            throw new Error('Expected regular clear phase');

        const advanced = expect_function_pure(advance_phase_state, phase, 200, 30);

        expect(advanced.frame_index).toBe(1);
        expect(advanced.next_frame_at).toBe(230);
        expect(phase.frame_index).toBe(0);
        expect(phase.next_frame_at).toBe(125);
    });

    it('returns the current frame and falls back to final_board when out of range', () => {
        const phase = create_regular_clear_phase([
            ['T', 'T', 'T', 'T'],
            ['.', '.', '.', '.'],
        ], 100, 25);

        expect(phase).not.toBeNull();
        if (!phase)
            throw new Error('Expected regular clear phase');

        expect(expect_function_pure(get_current_phase_frame, phase)).toEqual(phase.frames[0]);
        expect(expect_function_pure(
            get_current_phase_frame,
            { ...phase, frame_index: phase.frames.length + 5 },
        )).toEqual(phase.final_board);
    });

    it('reports clear phases as done only after the last frame index', () => {
        const phase = create_regular_clear_phase([
            ['T', 'T', 'T', 'T'],
            ['.', '.', '.', '.'],
        ], 100, 25);

        expect(phase).not.toBeNull();
        if (!phase)
            throw new Error('Expected regular clear phase');

        expect(expect_function_pure(is_clear_phase_done, phase)).toBe(false);
        expect(expect_function_pure(
            is_clear_phase_done,
            { ...phase, frame_index: phase.frames.length - 1 },
        )).toBe(false);
        expect(expect_function_pure(
            is_clear_phase_done,
            { ...phase, frame_index: phase.frames.length },
        )).toBe(true);
    });
});
