import { describe, expect, it } from 'vitest';

import { Player } from '../../../models/player_model.js';
import { PlayerStore } from '../../../stores/players_store.js';
import { playerStatusType } from '../../../types/status_types.js';

describe('PlayerStore', () => {
    it('adds players and retrieves them by all supported keys', () => {
        const store = new PlayerStore();
        const alice = create_player('id-1', 'alice', 'sid-1', 'socket-1');
        const bob = create_player('id-2', 'bob', 'sid-2', 'socket-2');

        expect(store.add_player(alice)).toEqual({ success: true, data: null });
        expect(store.add_player(bob)).toEqual({ success: true, data: null });

        expect(store.get_all_u_names()).toEqual(['alice', 'bob']);
        expect(store.get_all_ids()).toEqual(['id-1', 'id-2']);
        expect(store.get_player_by_sid('sid-1')).toEqual({ success: true, data: alice });
        expect(store.get_player_by_socket_id('socket-2')).toEqual({ success: true, data: bob });
        expect(store.get_player_by_username('alice')).toEqual({ success: true, data: alice });
        expect(store.get_player_by_id('id-2')).toEqual({ success: true, data: bob });
    });

    it('rejects duplicate sid and duplicate username', () => {
        const store = new PlayerStore();

        expect(store.add_player(create_player('id-1', 'alice', 'sid-1', 'socket-1')))
            .toEqual({ success: true, data: null });

        expect(store.add_player(create_player('id-2', 'bob', 'sid-1', 'socket-2')))
            .toEqual({ success: false, code: 'PLAYER_EXIST' });

        expect(store.add_player(create_player('id-3', 'alice', 'sid-3', 'socket-3')))
            .toEqual({ success: false, code: 'USERNAME_TAKEN' });
    });

    it('updates socket mapping and player status by sid', () => {
        const store = new PlayerStore();
        const alice = create_player('id-1', 'alice', 'sid-1', 'socket-1');

        store.add_player(alice);

        expect(store.set_socket_by_sid('sid-1', 'socket-9')).toEqual({ success: true, data: null });
        expect(store.get_player_by_socket_id('socket-1')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
        expect(store.get_player_by_socket_id('socket-9')).toEqual({ success: true, data: alice });

        expect(store.set_player_status_by_sid('sid-1', playerStatusType.playing))
            .toEqual({ success: true, data: null });
        expect(alice.get_player_status()).toBe(playerStatusType.playing);

        expect(store.set_socket_by_sid('ghost', 'socket-x')).toEqual({
            success: false,
            code: 'PLAYER_NOT_FOUND',
        });
        expect(store.set_player_status_by_sid('ghost', playerStatusType.ready)).toEqual({
            success: false,
            code: 'PLAYER_NOT_FOUND',
        });
    });

    it('removes players and clears all associated mappings', () => {
        const store = new PlayerStore();
        const alice = create_player('id-1', 'alice', 'sid-1', 'socket-1');

        store.add_player(alice);

        expect(store.remove_player(alice)).toEqual({ success: true, data: null });
        expect(store.get_player_by_sid('sid-1')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
        expect(store.get_player_by_socket_id('socket-1')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
        expect(store.get_player_by_username('alice')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
        expect(store.get_player_by_id('id-1')).toEqual({ success: false, code: 'PLAYER_NOT_FOUND' });
        expect(store.remove_player(alice)).toEqual({ success: false, code: 'SID_NOT_FOUND' });
    });
});

function create_player(
    player_id: string,
    username: string,
    sid: string,
    socket_id: string,
): Player {
    return new Player(
        player_id,
        username,
        playerStatusType.connected,
        sid,
        socket_id,
        '2026-01-01T00:00:00.000Z',
        `csrf-${player_id}`,
    );
}
