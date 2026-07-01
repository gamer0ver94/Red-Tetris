import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { gameStatusType, playerStatusType } from '../../types/status_types.js';
import * as test_game from '../helpers/test.game_helpers.js';
import * as test_sockets from '../helpers/test.socket_helpers.js';
import type { TestAuthUser, TestSocketClient } from '../test.types.js';

describe('integration: leave playing flow', () => {
    let baseUrl: string;
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
        process.env.CLIENT_ORIGIN = 'http://localhost:1700';
        app = await build_server();
        baseUrl = await test_sockets.start_socket_server(app);
    });

    afterAll(async () => {
        await test_sockets.close_socket_server(app);
    });

    it('does not set active-game leaver to win or lose', async() => {
        const { game_id, host, host_socket, opponent_socket } = await start_two_player_game('leave_no_result');

        try {
            const leaver_win = test_sockets.receive_socket_as(host_socket, 'game:win', 150);
            const leaver_lose = test_sockets.receive_socket_as(host_socket, 'game:lose', 150);

            await test_game.set_leave_game_for_user(host_socket);

            await expect(leaver_win).rejects.toThrow(/Timeout waiting/);
            await expect(leaver_lose).rejects.toThrow(/Timeout waiting/);

            const host_player = app.store.get_player_store().get_player_by_id(host.player_id);
            expect(host_player.success).toBe(true);
            if (!host_player.success)
                throw new Error('Expected host player');
            expect(host_player.data.get_player_status()).toBe(playerStatusType.waiting);

            const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
            expect(lobby_res.success).toBe(true);
            if (!lobby_res.success)
                throw new Error('Expected lobby');
            expect(lobby_res.data.has_player(host.player_id)).toBe(true);
        } finally {
            test_sockets.close_socket_client(host_socket);
            test_sockets.close_socket_client(opponent_socket);
        }
    });

    it('sets remaining player as winner when one opponent leaves active game', async() => {
        const { game_id, host, host_socket, opponent_socket } = await start_two_player_game('leave_remaining_wins');

        try {
            const host_win = test_sockets.receive_socket_as(host_socket, 'game:win');

            await test_game.set_leave_game_for_user(opponent_socket);
            await host_win;

            const active_res = app.store.get_active_game_store().get_active_game_by_lobby_id(game_id);
            expect(active_res.success).toBe(false);

            const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
            expect(lobby_res.success).toBe(true);
            if (!lobby_res.success)
                throw new Error('Expected lobby');
            expect(lobby_res.data.get_game_status()).toBe(gameStatusType.waiting);
            expect(lobby_res.data.has_player(host.player_id)).toBe(true);

            const host_player = app.store.get_player_store().get_player_by_id(host.player_id);
            expect(host_player.success).toBe(true);
            if (!host_player.success)
                throw new Error('Expected host player');
            expect(host_player.data.get_player_status()).toBe(playerStatusType.waiting);
        } finally {
            test_sockets.close_socket_client(host_socket);
            test_sockets.close_socket_client(opponent_socket);
        }
    });

    it('lets remaining player restart a game', async() => {
        const { game_id, host_socket, opponent_socket } = await start_two_player_game('leave_restart');

        try {
            const host_win = test_sockets.receive_socket_as(host_socket, 'game:win');

            await test_game.set_leave_game_for_user(opponent_socket);
            await host_win;

            await test_game.set_ready_for_user(host_socket);
            await test_game.set_ready_for_user(opponent_socket);
            await test_game.set_start_for_user(host_socket, [host_socket, opponent_socket]);

            const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
            expect(lobby_res.success).toBe(true);
            if (!lobby_res.success)
                throw new Error('Expected lobby');
            expect(lobby_res.data.get_game_status()).toBe(gameStatusType.started);

            const active_res = app.store.get_active_game_store().get_active_game_by_lobby_id(game_id);
            expect(active_res.success).toBe(true);
        } finally {
            test_sockets.close_socket_client(host_socket);
            test_sockets.close_socket_client(opponent_socket);
        }
    });

    it('lets remaining players continue active game when more than one player remains', async() => {
        const host = await test_game.register_player('leave_continue_host', app, baseUrl);
        const second = await test_game.register_player('leave_continue_second', app, baseUrl);
        const third = await test_game.register_player('leave_continue_third', app, baseUrl);

        try {
            const game_id = await test_game.create_and_start_game(
                app,
                host.user,
                host.socket,
                'classic',
                [second.socket, third.socket],
            );

            await test_game.set_leave_game_for_user(host.socket);

            const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
            expect(lobby_res.success).toBe(true);
            if (!lobby_res.success)
                throw new Error('Expected lobby');
            expect(lobby_res.data.get_game_status()).toBe(gameStatusType.started);
            expect(lobby_res.data.has_player(host.user.player_id)).toBe(true);

            const active_res = app.store.get_active_game_store().get_active_game_by_lobby_id(game_id);
            expect(active_res.success).toBe(true);
            if (!active_res.success)
                throw new Error('Expected active game');
            expect(active_res.data.has_player(host.user.player_id)).toBe(false);
            expect(active_res.data.has_player(second.user.player_id)).toBe(true);
            expect(active_res.data.has_player(third.user.player_id)).toBe(true);

            const host_player = app.store.get_player_store().get_player_by_id(host.user.player_id);
            expect(host_player.success).toBe(true);
            if (!host_player.success)
                throw new Error('Expected host player');
            expect(host_player.data.get_player_status()).toBe(playerStatusType.waiting);
        } finally {
            test_sockets.close_socket_client(host.socket);
            test_sockets.close_socket_client(second.socket);
            test_sockets.close_socket_client(third.socket);
        }
    });

    async function start_two_player_game(prefix: string): Promise<{
        game_id: string;
        host: TestAuthUser;
        host_socket: TestSocketClient;
        opponent: TestAuthUser;
        opponent_socket: TestSocketClient;
    }> {
        const { user: host, socket: host_socket } = await test_game.register_player(`${prefix}_host`, app, baseUrl);
        const { user: opponent, socket: opponent_socket } = await test_game.register_player(`${prefix}_opponent`, app, baseUrl);
        const game_id = await test_game.create_and_start_game(
            app,
            host,
            host_socket,
            'classic',
            [opponent_socket],
        );

        return {
            game_id,
            host,
            host_socket,
            opponent,
            opponent_socket,
        };
    }
});
