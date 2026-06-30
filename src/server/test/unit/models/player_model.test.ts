import { describe, expect, it } from 'vitest';

import { Player } from '../../../models/player_model.js';
import { playerStatusType } from '../../../types/status_types.js';

describe('Player', () => {
    it('stores constructor values in getters', () => {
        const player = new Player(
            'player-1',
            'alice',
            playerStatusType.waiting,
            'sid-1',
            'socket-1',
            '2026-01-01T00:00:00.000Z',
            'csrf-1',
        );

        expect(player.get_player_id()).toBe('player-1');
        expect(player.get_username()).toBe('alice');
        expect(player.get_player_status()).toBe(playerStatusType.waiting);
        expect(player.get_sid()).toBe('sid-1');
        expect(player.get_socket()).toBe('socket-1');
        expect(player.get_csrf_token()).toBe('csrf-1');
    });

    it('updates status and socket independently', () => {
        const player = new Player(
            'player-2',
            'bob',
            playerStatusType.connected,
            'sid-2',
            'socket-2',
            '2026-01-02T00:00:00.000Z',
            'csrf-2',
        );

        player.set_player_status(playerStatusType.playing);
        player.set_socket('socket-3');

        expect(player.get_player_status()).toBe(playerStatusType.playing);
        expect(player.get_socket()).toBe('socket-3');
        expect(player.get_player_id()).toBe('player-2');
        expect(player.get_username()).toBe('bob');
    });
});
