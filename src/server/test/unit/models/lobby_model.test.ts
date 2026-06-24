import { describe, expect, it } from 'vitest';

import { Lobby } from '../../../models/lobby_model.js';
import { CLASSIC_OPTS, EASY_OPTS } from '../../../types/pre_made_options.js';
import { gameStatusType } from '../../../types/status_types.js';

describe('Lobby', () => {
    it('stores constructor values and starts with created status', () => {
        const lobby = new Lobby('lobby-1', 'owner-1', CLASSIC_OPTS, 'classic');

        expect(lobby.get_lobby_id()).toBe('lobby-1');
        expect(lobby.get_owner_id()).toBe('owner-1');
        expect(lobby.get_game_opts()).toBe(CLASSIC_OPTS);
        expect(lobby.get_game_mode()).toBe('classic');
        expect(lobby.get_game_status()).toBe(gameStatusType.created);
        expect(lobby.get_player_ids()).toEqual([]);
        expect(lobby.get_player_count()).toBe(0);
    });

    it('adds, removes, and checks players and owner', () => {
        const lobby = new Lobby('lobby-2', 'owner-1', CLASSIC_OPTS, 'classic');

        lobby.add_player('owner-1');
        lobby.add_player('player-2');

        expect(lobby.has_player('owner-1')).toBe(true);
        expect(lobby.has_player('player-2')).toBe(true);
        expect(lobby.has_player('ghost')).toBe(false);
        expect(lobby.is_owner('owner-1')).toBe(true);
        expect(lobby.is_owner('player-2')).toBe(false);
        expect(lobby.get_player_count()).toBe(2);

        lobby.set_owner('player-2');
        expect(lobby.get_owner_id()).toBe('player-2');
        expect(lobby.is_owner('player-2')).toBe(true);

        lobby.remove_player('owner-1');
        expect(lobby.has_player('owner-1')).toBe(false);
        expect(lobby.get_player_ids()).toEqual(['player-2']);
        expect(lobby.get_player_count()).toBe(1);
    });

    it('allows joins only while waiting and under capacity', () => {
        const unlimited = new Lobby('lobby-3', 'owner-1', CLASSIC_OPTS, 'classic');
        const capped = new Lobby('lobby-4', 'owner-1', EASY_OPTS, 'easy');

        expect(unlimited.can_join()).toBe(false);

        unlimited.set_game_status(gameStatusType.waiting);
        expect(unlimited.can_join()).toBe(true);

        capped.set_game_status(gameStatusType.waiting);
        capped.add_player('owner-1');
        expect(capped.can_join()).toBe(true);

        capped.add_player('player-2');
        expect(capped.can_join()).toBe(false);

        capped.set_game_status(gameStatusType.started);
        expect(capped.can_join()).toBe(false);
    });
});
