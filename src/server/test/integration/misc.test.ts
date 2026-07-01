import { describe, expect, it, vi } from 'vitest';

import { Player } from '../../models/player_model.js';
import { Lobby } from '../../models/lobby_model.js';
import { Store } from '../../stores/store.js';
import {
    change_game_status,
    change_player_status,
    get_all_watchers,
    get_page_for_socket_id,
    history_unwatch,
    history_watch,
    should_update,
} from '../../sockets/misc_sockets.js';
import { CLASSIC_OPTS } from '../../types/pre_made_options.js';
import { gameStatusType, playerStatusType } from '../../types/status_types.js';
import type { HistoryEntry, HistoryWatchState } from '../../types/history_types.js';

describe('misc socket helpers', () => {
    it('changes player and game status while emitting socket events', async() => {
        const store = new Store();
        const player = add_player(store, 'p1', 'alice', 'sid-1', 'sock-1');
        const lobby = add_lobby(store, 'lobby-1', player.get_player_id(), [player.get_player_id()]);
        const io = create_io_mock();

        await change_player_status(io as any, playerStatusType.ready, player.get_sid(), store.get_player_store());
        await change_game_status(io as any, gameStatusType.started, lobby.get_lobby_id(), [player.get_sid()], store);

        expect(player.get_player_status()).toBe(playerStatusType.ready);
        expect(lobby.get_game_status()).toBe(gameStatusType.started);
        expect(io.emit).toHaveBeenCalledWith('player_status:change', { new_status: playerStatusType.ready });
        expect(io.emit).toHaveBeenCalledWith('game_status:change', { new_status: gameStatusType.started });
    });

    it('watches, replaces, un-watches, and ignores missing players', () => {
        const store = new Store();
        const player = add_player(store, 'p1', 'alice', 'sid-1', 'sock-1');
        const first: HistoryWatchState = { page: '/score', start: 0, end: 10 };
        const second: HistoryWatchState = { page: '/me', start: 0, end: 10 };

        expect(history_watch('missing', first, store)).toBe(false);
        expect(history_watch(player.get_sid(), first, store)).toBe(true);
        expect(get_page_for_socket_id(player.get_socket())).toEqual(first);
        expect(history_watch(player.get_sid(), second, store)).toBe(true);
        expect(get_page_for_socket_id(player.get_socket())).toEqual(second);
        expect(get_all_watchers().some(([socket]) => socket === player.get_socket())).toBe(true);
        expect(history_unwatch('missing', store)).toBe(false);
        expect(history_unwatch(player.get_sid(), store)).toBe(true);
        expect(get_page_for_socket_id(player.get_socket())).toBeNull();
    });

    it('resolves history update interest for every page type', () => {
        const entries = [
            entry({ username: 'alice', is_winner: true, game_mode: 'classic', lobby_id: 'lobby-1' }),
            entry({ username: 'bob', is_winner: false, game_mode: 'hard', lobby_id: 'lobby-2' }),
        ];

        expect(should_update({ page: '/date', new_first: true, start: 0, end: 10 }, entries, 'alice')).toBe(true);
        expect(should_update({ page: '/score', start: 0, end: 10 }, entries, 'alice')).toBe(true);
        expect(should_update({ page: '/win', start: 0, end: 10 }, entries, 'alice')).toBe(true);
        expect(should_update({ page: '/lose', start: 0, end: 10 }, entries, 'alice')).toBe(true);
        expect(should_update({ page: '/lobby', lobby_id: 'lobby-1', start: 0, end: 10 }, entries, 'alice')).toBe(true);
        expect(should_update({ page: '/mode', mode: 'classic', start: 0, end: 10 }, entries, 'alice')).toBe(true);
        expect(should_update({ page: '/users', query: 'ali', start: 0, end: 10 }, entries, 'alice')).toBe(true);
        expect(should_update({ page: '/me', start: 0, end: 10 }, entries, 'alice')).toBe(true);
        expect(should_update({ page: '/me', start: 0, end: 10 }, [], 'alice')).toBe(false);
        expect(should_update({ page: '/lobby', lobby_id: 'none', start: 0, end: 10 }, entries, 'alice')).toBe(false);
        expect(should_update({ page: '/mode', mode: 'none', start: 0, end: 10 }, entries, 'alice')).toBe(false);
        expect(should_update({ page: '/users', query: 'zzz', start: 0, end: 10 }, entries, 'alice')).toBe(false);
        expect(should_update({ page: '/me', start: 0, end: 10 }, entries, 'carol')).toBe(false);
    });
});

function create_io_mock() {
    const emit = vi.fn();

    return {
        emit,
        to: vi.fn(() => ({ emit })),
    };
}

function add_player(store: Store, id: string, username: string, sid: string, socket: string): Player {
    const player = new Player(id, username, playerStatusType.waiting, sid, socket, 'now', 'csrf');
    expect(store.get_player_store().add_player(player).success).toBe(true);
    return player;
}

function add_lobby(store: Store, id: string, owner_id: string, player_ids: string[]): Lobby {
    const lobby = new Lobby(id, owner_id, CLASSIC_OPTS, 'classic');
    lobby.set_game_status(gameStatusType.waiting);
    expect(store.get_lobby_store().add_lobby(lobby).success).toBe(true);
    for (const player_id of player_ids)
        expect(store.get_lobby_store().add_player_to_lobby(player_id, id).success).toBe(true);
    return lobby;
}

function entry(overrides: Partial<HistoryEntry>): HistoryEntry {
    return {
        username: 'alice',
        is_winner: true,
        score: 10,
        is_hidden: false,
        game_mode: 'classic',
        total_time: '1000',
        end_date: '2026-01-01T00:00:00.000Z',
        lobby_id: 'lobby-1',
        ...overrides,
    };
}
