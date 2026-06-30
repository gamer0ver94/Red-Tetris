import { describe, expect, it } from 'vitest';

import { ActiveGame } from '../../../models/active_game_model.js';
import { Board } from '../../../models/board_model.js';
import { Lobby } from '../../../models/lobby_model.js';
import { PlayerInGame } from '../../../models/player_in_game_model.js';
import { Player } from '../../../models/player_model.js';
import { Store } from '../../../stores/store.js';
import { CLASSIC_OPTS } from '../../../types/pre_made_options.js';
import { gameStatusType, playerStatusType } from '../../../types/status_types.js';

describe('Store', () => {
    it('returns socket ids, sids, and usernames for players in a lobby', () => {
        const store = new Store();
        const owner = create_player('id-1', 'alice', 'sid-1', 'socket-1', playerStatusType.waiting);
        const joiner = create_player('id-2', 'bob', 'sid-2', 'socket-2', playerStatusType.ready);
        const lobby = create_waiting_lobby('lobby-1', owner.get_player_id());

        store.get_player_store().add_player(owner);
        store.get_player_store().add_player(joiner);
        store.get_lobby_store().add_lobby(lobby);
        store.get_lobby_store().add_player_to_lobby(owner.get_player_id(), 'lobby-1');
        store.get_lobby_store().add_player_to_lobby(joiner.get_player_id(), 'lobby-1');

        expect(store.get_all_sockets_by_lobby_id('lobby-1')).toEqual({
            success: true,
            data: ['socket-1', 'socket-2'],
        });
        expect(store.get_all_sids_by_lobby_id('lobby-1')).toEqual({
            success: true,
            data: ['sid-1', 'sid-2'],
        });
        expect(store.get_all_usernames_by_lobby_id('lobby-1')).toEqual({
            success: true,
            data: ['alice', 'bob'],
        });
        expect(store.get_all_sockets_by_lobby_id('missing')).toEqual({
            success: false,
            code: 'LOBBY_NOT_FOUND',
        });
    });

    it('returns a board and player-in-game for a player sid once an active game is mapped', () => {
        const store = new Store();
        const player = create_player('id-1', 'alice', 'sid-1', 'socket-1', playerStatusType.playing);
        const active_game = new ActiveGame('lobby-1', CLASSIC_OPTS, [player.get_player_id()]);
        const player_in_game = new PlayerInGame(new Board(4, 4), player.get_player_id());

        store.get_player_store().add_player(player);
        store.get_active_game_store().add_active_game(active_game);
        store.get_active_game_store().add_player_to_active_game(
            player.get_player_id(),
            player_in_game,
            'lobby-1',
        );

        expect(store.get_board_by_sid('sid-1')).toEqual({
            success: true,
            data: player_in_game.get_board(),
        });
        expect(store.get_player_in_game_by_sid('sid-1')).toEqual({
            success: true,
            data: player_in_game,
        });
        expect(store.get_board_by_sid('ghost')).toEqual({
            success: false,
            code: 'PLAYER_NOT_FOUND',
        });
    });

    it('checks whether all other players in a lobby are ready', () => {
        const store = new Store();
        const owner = create_player('id-1', 'alice', 'sid-1', 'socket-1', playerStatusType.waiting);
        const ready = create_player('id-2', 'bob', 'sid-2', 'socket-2', playerStatusType.ready);
        const waiting = create_player('id-3', 'carol', 'sid-3', 'socket-3', playerStatusType.waiting);
        const lobby = create_waiting_lobby('lobby-1', owner.get_player_id());

        for (const player of [owner, ready, waiting])
            store.get_player_store().add_player(player);
        store.get_lobby_store().add_lobby(lobby);
        for (const player of [owner, ready, waiting])
            store.get_lobby_store().add_player_to_lobby(player.get_player_id(), 'lobby-1');

        expect(store.are_all_players_ready(owner.get_sid())).toEqual({
            success: true,
            data: false,
        });

        waiting.set_player_status(playerStatusType.ready);
        expect(store.are_all_players_ready(owner.get_sid())).toEqual({
            success: true,
            data: true,
        });

        expect(store.are_all_players_ready('ghost')).toEqual({
            success: false,
            code: 'PLAYER_NOT_FOUND',
        });
    });
});

function create_player(
    player_id: string,
    username: string,
    sid: string,
    socket_id: string,
    status: typeof playerStatusType[keyof typeof playerStatusType],
): Player {
    return new Player(
        player_id,
        username,
        status,
        sid,
        socket_id,
        '2026-01-01T00:00:00.000Z',
        `csrf-${player_id}`,
    );
}

function create_waiting_lobby(lobby_id: string, owner_id: string): Lobby {
    const lobby = new Lobby(lobby_id, owner_id, CLASSIC_OPTS, 'classic');
    lobby.set_game_status(gameStatusType.waiting);
    return lobby;
}
