import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PieceProvider } from '../../../models/piece_provider_model.js';

describe('PieceProvider', () => {
    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('rejects duplicate registration and tracks removal', () => {
        const provider = new PieceProvider(['p1'], false, false);

        expect(provider.register_player('p1')).toEqual({
            success: false,
            code: 'PLAYER_IN_ACTIVE_GAME',
        });
        expect(provider.remove_player('p1')).toEqual({
            success: true,
            data: null,
        });
        expect(provider.remove_player('p1')).toEqual({
            success: false,
            code: 'PLAYER_NOT_REGISTERED',
        });
    });

    it('shares the same preview between players and loops when random is disabled', () => {
        const provider = new PieceProvider(['p1', 'p2'], false, true);

        const preview1 = provider.peek_for_player('p1', 7);
        const preview2 = provider.peek_for_player('p2', 7);
        expect(preview1.success).toBe(true);
        expect(preview2.success).toBe(true);
        if (!preview1.success || !preview2.success)
            throw new Error('Expected shared previews');

        expect(preview1.data).toEqual(preview2.data);

        const consumed = Array.from({ length: 7 }, () => provider.get_next_piece_for_player('p1'));
        consumed.forEach((result) => expect(result.success).toBe(true));

        const looped = provider.get_next_piece_for_player('p1');
        expect(looped.success).toBe(true);
        if (!looped.success)
            throw new Error('Expected looped next piece');
        expect(looped.data).toBe(preview1.data[0]);

        const firstP2 = provider.get_next_piece_for_player('p2');
        expect(firstP2.success).toBe(true);
        if (!firstP2.success)
            throw new Error('Expected player two next piece');
        expect(firstP2.data).toBe(preview2.data[0]);
    });

    it('extends previews beyond one sequence when random mode is enabled', () => {
        const provider = new PieceProvider(['p1'], true, false);

        const preview = provider.peek_for_player('p1', 10);
        expect(preview.success).toBe(true);
        if (!preview.success)
            throw new Error('Expected extended preview');
        expect(preview.data).toHaveLength(10);

        for (let i = 0; i < 10; i += 1)
            expect(provider.get_next_piece_for_player('p1').success).toBe(true);
    });

    it('keeps shared random sequences aligned after extending past the first bag', () => {
        const provider = new PieceProvider(['p1', 'p2'], true, true);

        const preview1 = provider.peek_for_player('p1', 9);
        const preview2 = provider.peek_for_player('p2', 9);

        expect(preview1.success).toBe(true);
        expect(preview2.success).toBe(true);
        if (!preview1.success || !preview2.success)
            throw new Error('Expected shared random previews');

        expect(preview1.data).toEqual(preview2.data);

        const consumed = Array.from({ length: 8 }, () => provider.get_next_piece_for_player('p1'));
        consumed.forEach((result) => expect(result.success).toBe(true));

        const next = provider.get_next_piece_for_player('p1');
        expect(next.success).toBe(true);
        if (!next.success)
            throw new Error('Expected appended shared piece');
        expect(next.data).toBe(preview1.data[8]);
    });

    it('fails lookups for unknown players when no sequence is registered', () => {
        const provider = new PieceProvider([], false, false);

        expect(provider.get_next_piece_for_player('ghost')).toEqual({
            success: false,
            code: 'PIECE_SEQUENCE_NOT_FOUND',
        });
        expect(provider.peek_for_player('ghost', 3)).toEqual({
            success: false,
            code: 'PIECE_SEQUENCE_NOT_FOUND',
        });
    });
});
