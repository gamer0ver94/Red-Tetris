import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { inject_as, register_user, unique_username } from '../helpers/auth_helpers.test.js';
import {
    close_socket_client,
    close_socket_server,
    receive_connect_error,
    register_socket_client,
    register_ready_socket_client,
    start_socket_server,
} from '../helpers/socket_helpers.test.js';
import { gameStatusType, playerStatusType } from '../../types/status_types.js';

describe('integration: socket session flow', () => {
    let app: FastifyInstance;
    let baseUrl: string;

    beforeAll(async () => {
        process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
        process.env.CLIENT_ORIGIN = 'http://localhost:1700';
        app = await build_server();
        baseUrl = await start_socket_server(app);
    });

    afterAll(async () => {
        await close_socket_server(app);
    });

    describe('socket first connection', () => {
        it('connects with valid session + csrf', async () => {
            const user = await register_user(app, unique_username('socket_ok'));
            const socket = await register_socket_client(baseUrl, user);
            try {
                expect(socket.connected).toBe(true);

                const player_res = app.store.get_player_store().get_player_by_id(user.player_id);
                expect(player_res.success).toBe(true);
                if (!player_res.success)
                    throw new Error('Expected connected player to exist');
                expect(player_res.data.get_player_status()).toBe(playerStatusType.connected);
            } finally {
                await inject_as(app, user, { method: 'GET', url: '/auth/logout' });
                close_socket_client(socket);
            }
        });

        it('rejects missing csrf token', async () => {
            const user = await register_user(app, unique_username('no_token_socket'));
            const socket = await register_socket_client(baseUrl, user, {
                csrf_token: '',
                wait_for_connect: false,
            });

            try {
                const reason = await receive_connect_error(socket);
                expect(reason).toBe('missing csrf token');
            } finally {
                close_socket_client(socket);
            }
        });

        it('rejects wrong csrf token', async () => {
            const user = await register_user(app, unique_username('wrong_token_socket'));
            const socket = await register_socket_client(baseUrl, user, {
                csrf_token: 'Wrong TOKEN',
                wait_for_connect: false,
            });

            try {
                const reason = await receive_connect_error(socket);
                expect(reason).toBe('forbidden');
            } finally {
                close_socket_client(socket);
            }
        });

        it('rejects missing session cookie', async () => {
            const user = await register_user(app, unique_username('no_sid_socket'));
            const socket = await register_socket_client(baseUrl, user, {
                wait_for_connect: false,
                cookie: '',
            });

            try {
                const reason = await receive_connect_error(socket);
                expect(reason).toBe('missing session');
            } finally {
                close_socket_client(socket);
            }
        });
    });

    describe('socket reconnection', () => {
        it('marks player as disconnected on socket disconnect', async () => {
            const user = await register_user(app, unique_username('disconnect_socket'));
            const { socket } = await register_ready_socket_client(baseUrl, user);
            close_socket_client(socket);

            await vi.waitFor(async () => {
                const player_res = app.store.get_player_store().get_player_by_id(user.player_id);
                expect(player_res.success).toBe(true);
                if (!player_res.success)
                    throw new Error('Expected disconnected player to exist');
                expect(player_res.data.get_player_status()).toBe(playerStatusType.disconnected);
            });
        });

        it('removes player after timeout', async () => {
            const user = await register_user(app, unique_username('disconnect_timeout_socket'));
            const { socket } = await register_ready_socket_client(baseUrl, user);
            close_socket_client(socket);

            await new Promise((resolve) => setTimeout(resolve, 31000));

            const player_res = app.store.get_player_store().get_player_by_id(user.player_id);
            expect(player_res.success).toBe(false);
        }, 35000);

        it('restores player before timeout', async () => {
            const user = await register_user(app, unique_username('reconnect_socket'));
            const { socket } = await register_ready_socket_client(baseUrl, user);
            close_socket_client(socket);

            await vi.waitFor(async () => {
                const player_res = app.store.get_player_store().get_player_by_id(user.player_id);
                expect(player_res.success).toBe(true);
                if (!player_res.success)
                    throw new Error('Expected disconnected player to exist');
                expect(player_res.data.get_player_status()).toBe(playerStatusType.disconnected);
            });

            const { socket: socket2, resume: payload } = await register_ready_socket_client(baseUrl, user);
            try {
                expect(payload.player.username).toBe(user.username);
                expect(payload.player.player_id).toBe(user.player_id);
                expect(payload.player.csrf_token).toBe(user.csrf_token);
                expect(payload.reconnected).toBe(true);
            } finally {
                await inject_as(app, user, { method: 'GET', url: '/auth/logout' });
                close_socket_client(socket2);
            }
        });

        it('restores game lobby on reconnect', async () => {
            const user = await register_user(app, unique_username('reconnect_lobby_socket'));
            const { socket } = await register_ready_socket_client(baseUrl, user);

            const game_res = await inject_as(app, user, {
                method: 'POST',
                url: '/game/create',
                payload: { game_mode: 'classic' },
            });
            expect(game_res.statusCode).toBe(201);
            const game_id = game_res.json().game_id;

            const lobby_res = app.store.get_lobby_store().get_lobby_by_player_id(user.player_id);
            expect(lobby_res.success).toBe(true);
            if (!lobby_res.success)
                throw new Error('Expected lobby to exist');
            expect(lobby_res.data.get_lobby_id()).toBe(game_id);

            close_socket_client(socket);

            await vi.waitFor(async () => {
                const player_res = app.store.get_player_store().get_player_by_id(user.player_id);
                expect(player_res.success).toBe(true);
                if (!player_res.success)
                    throw new Error('Expected disconnected player to exist');
                expect(player_res.data.get_player_status()).toBe(playerStatusType.disconnected);
            });

            const { socket: socket2, resume: payload } = await register_ready_socket_client(baseUrl, user);
            try {
                expect(payload.player.username).toBe(user.username);
                expect(payload.player.player_id).toBe(user.player_id);
                expect(payload.player.csrf_token).toBe(user.csrf_token);
                expect(payload.player.player_status).toBe(playerStatusType.waiting);
                expect(payload.reconnected).toBe(true);
                expect(payload.game?.game_id).toBe(game_id);
                expect(payload.game?.game_status).toBe(gameStatusType.waiting);
                expect(payload.game?.players_ids).toContain(user.player_id);
            } finally {
                await inject_as(app, user, { method: 'GET', url: '/auth/logout' });
                close_socket_client(socket2);
            }
        });
    });
});
