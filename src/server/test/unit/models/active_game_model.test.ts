import { afterEach, describe, expect, it, vi } from 'vitest';

import { Board } from '../../../models/board_model.js';
import { ActiveGame } from '../../../models/active_game_model.js';
import { PlayerInGame } from '../../../models/player_in_game_model.js';
import { CLASSIC_OPTS } from '../../../types/pre_made_options.js';
import { pieceType } from '../../../types/game_types.js';

describe('ActiveGame', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('stores constructor values and exposes piece previews from its provider', () => {
        vi.useFakeTimers();
        vi.setSystemTime(5_000);
        vi.spyOn(Math, 'random').mockReturnValue(0);

        const game = new ActiveGame('lobby-1', CLASSIC_OPTS, ['p1', 'p2']);

        expect(game.get_lobby_id()).toBe('lobby-1');
        expect(game.get_start_time()).toBe(5_000);
        expect(game.get_config().get_preview_count()).toBe(CLASSIC_OPTS.pieces.nextPreviewCount);
        expect(game.get_players()).toEqual([]);
        expect(game.get_players_ids()).toEqual([]);

        const preview = game.peek_pieces_for_player('p1');
        expect(preview.success).toBe(true);
        if (!preview.success)
            throw new Error('Expected preview pieces');
        expect(preview.data).toHaveLength(CLASSIC_OPTS.pieces.nextPreviewCount);

        const next = game.get_next_piece_for_player('p1');
        expect(next.success).toBe(true);
        if (!next.success)
            throw new Error('Expected next piece');
        expect(Object.values(pieceType)).toContain(next.data);
    });

    it('adds, reads, and removes players from the active game', () => {
        const game = new ActiveGame('lobby-2', CLASSIC_OPTS, ['p1']);
        const player1 = create_player('p1');
        const player2 = create_player('p2');

        expect(game.add_player('p1', player1)).toEqual({ success: true, data: null });
        expect(game.add_player('p2', player2)).toEqual({ success: true, data: null });
        expect(game.add_player('p1', player1)).toEqual({
            success: false,
            code: 'PLAYER_IN_ACTIVE_GAME',
        });

        expect(game.has_player('p1')).toBe(true);
        expect(game.has_player('ghost')).toBe(false);
        expect(game.get_players()).toEqual([player1, player2]);
        expect(game.get_players_ids()).toEqual(['p1', 'p2']);
        expect(game.get_player('p1')).toEqual({ success: true, data: player1 });
        expect(game.get_player('ghost')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
        expect(game.get_opponents_of('p1')).toEqual([player2]);
        expect(game.get_opponents_of('ghost')).toEqual([player1, player2]);

        expect(game.remove_player('p2')).toEqual({ success: true, data: null });
        expect(game.get_player('p2')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
        expect(game.remove_player('p2')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
    });

    it('reports whether all tracked players are dead', () => {
        const game = new ActiveGame('lobby-3', CLASSIC_OPTS, ['p1', 'p2']);
        const player1 = create_player('p1');
        const player2 = create_player('p2');

        game.add_player('p1', player1);
        game.add_player('p2', player2);

        expect(game.are_all_dead()).toBe(false);

        player1.mark_lost();
        expect(game.are_all_dead()).toBe(false);

        player2.mark_lost();
        expect(game.are_all_dead()).toBe(true);
    });
});

function create_player(player_id: string): PlayerInGame {
    return new PlayerInGame(new Board(4, 4), player_id);
}
