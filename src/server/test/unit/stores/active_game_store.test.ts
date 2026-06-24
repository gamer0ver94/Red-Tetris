import { describe, expect, it } from 'vitest';

import { ActiveGame } from '../../../models/active_game_model.js';
import { Board } from '../../../models/board_model.js';
import { PlayerInGame } from '../../../models/player_in_game_model.js';
import { ActiveGameStore } from '../../../stores/active_game_store.js';
import { CLASSIC_OPTS } from '../../../types/pre_made_options.js';

describe('ActiveGameStore', () => {
    it('adds active games and retrieves them by lobby id', () => {
        const store = new ActiveGameStore();
        const game = new ActiveGame('lobby-1', CLASSIC_OPTS, ['p1']);

        expect(store.add_active_game(game)).toEqual({ success: true, data: null });
        expect(store.get_active_game_by_lobby_id('lobby-1')).toEqual({ success: true, data: game });
        expect(store.add_active_game(game)).toEqual({ success: false, code: 'ACTIVE_GAME_EXIST' });
        expect(store.get_active_game_by_lobby_id('missing')).toEqual({
            success: false,
            code: 'ACTIVE_GAME_NOT_FOUND',
        });
    });

    it('adds players to active games and maps them back by player id', () => {
        const store = new ActiveGameStore();
        const game = new ActiveGame('lobby-1', CLASSIC_OPTS, ['p1', 'p2']);
        const player = new PlayerInGame(new Board(4, 4), 'p1');

        store.add_active_game(game);

        expect(store.add_player_to_active_game('p1', player, 'lobby-1')).toEqual({
            success: true,
            data: null,
        });
        expect(store.get_active_game_by_player_id('p1')).toEqual({ success: true, data: game });
        expect(store.get_all_players_ids()).toEqual(['p1']);

        expect(store.add_player_to_active_game('p1', player, 'lobby-1')).toEqual({
            success: false,
            code: 'PLAYER_IN_ACTIVE_GAME',
        });
        expect(store.add_player_to_active_game('p2', new PlayerInGame(new Board(4, 4), 'p2'), 'missing'))
            .toEqual({
                success: false,
                code: 'ACTIVE_GAME_NOT_FOUND',
            });
    });

    it('removes players and deletes active games while clearing mappings', () => {
        const store = new ActiveGameStore();
        const game = new ActiveGame('lobby-1', CLASSIC_OPTS, ['p1', 'p2']);
        const player1 = new PlayerInGame(new Board(4, 4), 'p1');
        const player2 = new PlayerInGame(new Board(4, 4), 'p2');

        store.add_active_game(game);
        store.add_player_to_active_game('p1', player1, 'lobby-1');
        store.add_player_to_active_game('p2', player2, 'lobby-1');

        expect(store.remove_player_from_active_game('p1', 'other-lobby')).toEqual({
            success: false,
            code: 'ACTIVE_GAME_NOT_FOUND',
        });
        expect(store.remove_player_from_active_game('p1', 'lobby-1')).toEqual({
            success: true,
            data: null,
        });
        expect(store.get_active_game_by_player_id('p1')).toEqual({
            success: false,
            code: 'PLAYER_NOT_FOUND',
        });

        expect(store.delete_active_game(game)).toEqual({ success: true, data: null });
        expect(store.get_active_game_by_lobby_id('lobby-1')).toEqual({
            success: false,
            code: 'ACTIVE_GAME_NOT_FOUND',
        });
        expect(store.get_active_game_by_player_id('p2')).toEqual({
            success: false,
            code: 'PLAYER_NOT_FOUND',
        });
    });
});
