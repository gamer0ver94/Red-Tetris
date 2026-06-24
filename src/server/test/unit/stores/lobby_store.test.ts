import { describe, expect, it } from 'vitest';

import { Lobby } from '../../../models/lobby_model.js';
import { LobbyStore } from '../../../stores/lobby_store.js';
import { CLASSIC_OPTS, EASY_OPTS } from '../../../types/pre_made_options.js';
import { gameStatusType } from '../../../types/status_types.js';

describe('LobbyStore', () => {
    it('adds lobbies and retrieves them by id', () => {
        const store = new LobbyStore();
        const lobby = create_waiting_lobby('lobby-1', 'owner-1');

        expect(store.add_lobby(lobby)).toEqual({ success: true, data: null });
        expect(store.get_lobby_by_id('lobby-1')).toEqual({ success: true, data: lobby });
        expect(store.add_lobby(lobby)).toEqual({ success: false, code: 'LOBBY_EXIST' });
        expect(store.get_lobby_by_id('missing')).toEqual({ success: false, code: 'LOBBY_NOT_FOUND' });
    });

    it('adds players to lobbies and tracks player-to-lobby mapping', () => {
        const store = new LobbyStore();
        const lobby = create_waiting_lobby('lobby-1', 'owner-1');

        store.add_lobby(lobby);

        expect(store.add_player_to_lobby('owner-1', 'lobby-1')).toEqual({ success: true, data: null });
        expect(store.add_player_to_lobby('player-2', 'lobby-1')).toEqual({ success: true, data: null });
        expect(store.get_lobby_by_player_id('owner-1')).toEqual({ success: true, data: lobby });
        expect(store.get_all_players_ids()).toEqual(['owner-1', 'player-2']);
        expect(lobby.get_player_ids()).toEqual(['owner-1', 'player-2']);

        expect(store.add_player_to_lobby('owner-1', 'lobby-1')).toEqual({
            success: false,
            code: 'PLAYER_IN_LOBBY',
        });
    });

    it('rejects joins when the lobby is missing or cannot be joined', () => {
        const store = new LobbyStore();
        const started = create_waiting_lobby('lobby-started', 'owner-1');
        started.set_game_status(gameStatusType.started);
        const capped = new Lobby('lobby-capped', 'owner-1', EASY_OPTS, 'easy');
        capped.set_game_status(gameStatusType.waiting);

        store.add_lobby(started);
        store.add_lobby(capped);
        store.add_player_to_lobby('owner-1', 'lobby-capped');
        store.add_player_to_lobby('player-2', 'lobby-capped');

        expect(store.add_player_to_lobby('ghost', 'missing')).toEqual({
            success: false,
            code: 'LOBBY_NOT_FOUND',
        });
        expect(store.add_player_to_lobby('player-3', 'lobby-started')).toEqual({
            success: false,
            code: 'LOBBY_CANNOT_JOIN',
        });
        expect(store.add_player_to_lobby('player-3', 'lobby-capped')).toEqual({
            success: false,
            code: 'LOBBY_CANNOT_JOIN',
        });
    });

    it('removes players and deletes lobbies while clearing mappings', () => {
        const store = new LobbyStore();
        const lobby = create_waiting_lobby('lobby-1', 'owner-1');

        store.add_lobby(lobby);
        store.add_player_to_lobby('owner-1', 'lobby-1');
        store.add_player_to_lobby('player-2', 'lobby-1');

        expect(store.remove_player_from_lobby('player-2', 'lobby-1')).toEqual({ success: true, data: null });
        expect(store.get_lobby_by_player_id('player-2')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
        expect(lobby.get_player_ids()).toEqual(['owner-1']);

        expect(store.remove_player_from_lobby('player-2', 'lobby-1')).toEqual({
            success: false,
            code: 'PLAYER_NOT_FOUND',
        });
        expect(store.remove_player_from_lobby('owner-1', 'missing')).toEqual({
            success: false,
            code: 'LOBBY_NOT_FOUND',
        });

        expect(store.delete_lobby('lobby-1')).toEqual({ success: true, data: null });
        expect(store.get_lobby_by_id('lobby-1')).toEqual({ success: false, code: 'LOBBY_NOT_FOUND' });
        expect(store.get_lobby_by_player_id('owner-1')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
    });
});

function create_waiting_lobby(lobby_id: string, owner_id: string): Lobby {
    const lobby = new Lobby(lobby_id, owner_id, CLASSIC_OPTS, 'classic');
    lobby.set_game_status(gameStatusType.waiting);
    return lobby;
}
