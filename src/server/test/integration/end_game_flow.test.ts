import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { CLASSIC_OPTS } from '../../types/pre_made_options.js';
import type { GameOptions } from '../../types/game_options_types.js';
import { gameStatusType, playerStatusType } from '../../types/status_types.js';
import * as test_sockets from '../helpers/test.socket_helpers.js';
import * as test_game from '../helpers/test.game_helpers.js';
import * as test_types from '../test.types.js';

describe('integration: end game flow', () => {
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

    describe('game dead flow', () => {
        it('stop game when solo dies', async() => {
            const { user: host, socket: host_socket } = await test_game.register_player('solo_dead', app, baseUrl);

            try {
                const game_id = await test_game.create_and_start_game(app, host, host_socket, 'solo', []);
                const lose = test_sockets.receive_socket_as(host_socket, 'game:lose');

                test_game.mutate_player_in_game(app, host, { lost: true });

                await lose;
                expect_game_finished(game_id, host, [host.player_id], []);
            } finally {
                test_sockets.close_socket_client(host_socket);
            }
        });

        it('stop game when only one remains', async() => {
            const { user: host, socket: host_socket } = await test_game.register_player('survival_host', app, baseUrl);
            const { user: user2, socket: user2_socket } = await test_game.register_player('survival_2', app, baseUrl);
            const { user: user3, socket: user3_socket } = await test_game.register_player('survival_3', app, baseUrl);

            try {
                const game_id = await test_game.create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [user2_socket, user3_socket],
                    options_with_win('survival', null),
                );
                const host_win = test_sockets.receive_socket_as(host_socket, 'game:win');
                const user2_lose = test_sockets.receive_socket_as(user2_socket, 'game:lose');
                const user3_lose = test_sockets.receive_socket_as(user3_socket, 'game:lose');

                test_game.mutate_player_in_game(app, user2, { lost: true });
                test_game.mutate_player_in_game(app, user3, { lost: true });

                await Promise.all([host_win, user2_lose, user3_lose]);
                expect_game_finished(game_id, host, [user2.player_id, user3.player_id], [host.player_id]);
            } finally {
                test_sockets.close_socket_client(host_socket);
                test_sockets.close_socket_client(user2_socket);
                test_sockets.close_socket_client(user3_socket);
            }
        });

        it('stop game if all dead', async() => {
            const { user: host, socket: host_socket } = await test_game.register_player('all_dead_host', app, baseUrl);
            const { user: user2, socket: user2_socket } = await test_game.register_player('all_dead_2', app, baseUrl);

            try {
                const game_id = await test_game.create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [user2_socket],
                    options_with_win('survival', null),
                );
                const host_win = test_sockets.receive_socket_as(host_socket, 'game:win');
                const user2_lose = test_sockets.receive_socket_as(user2_socket, 'game:lose');

                test_game.mutate_player_in_game(app, host, { lost: true, score: 20 });
                test_game.mutate_player_in_game(app, user2, { lost: true, score: 10 });

                await Promise.all([host_win, user2_lose]);
                expect_game_finished(game_id, host, [user2.player_id], [host.player_id]);
            } finally {
                test_sockets.close_socket_client(host_socket);
                test_sockets.close_socket_client(user2_socket);
            }
        });
    });

    describe('game limit flow', () => {
        it('stop game at time limit', async() => {
            const { user: host, socket: host_socket } = await test_game.register_player('time_limit', app, baseUrl);

            try {
                const game_id = await test_game.create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [],
                    options_with_win('time', 80),
                );
                const win = test_sockets.receive_socket_as(host_socket, 'game:win', 1500);

                await win;
                expect_game_finished(game_id, host, [], [host.player_id]);
            } finally {
                test_sockets.close_socket_client(host_socket);
            }
        });

        it('stop game at score limit', async() =>{
            const { user: host, socket: host_socket } = await test_game.register_player('score_limit', app, baseUrl);

            try {
                const game_id = await test_game.create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [],
                    options_with_win('score', 100),
                );
                const win = test_sockets.receive_socket_as(host_socket, 'game:win');

                test_game.mutate_player_in_game(app, host, { score: 100 });

                await win;
                expect_game_finished(game_id, host, [], [host.player_id]);
            } finally {
                test_sockets.close_socket_client(host_socket);
            }
        });

        it('stop game at lines limit', async() => {
            const { user: host, socket: host_socket } = await test_game.register_player('lines_limit', app, baseUrl);

            try {
                const game_id = await test_game.create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [],
                    options_with_win('lines', 1),
                );
                const win = test_sockets.receive_socket_as(host_socket, 'game:win');

                test_game.mutate_player_in_game(app, host, { lines: 1 });

                await win;
                expect_game_finished(game_id, host, [], [host.player_id]);
            } finally {
                test_sockets.close_socket_client(host_socket);
            }
        });

        it('allowed multiple winner on score tie', async() => {
            const { user: host, socket: host_socket } = await test_game.register_player('tie_host', app, baseUrl);
            const { user: user2, socket: user2_socket } = await test_game.register_player('tie_2', app, baseUrl);

            try {
                const game_id = await test_game.create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [user2_socket],
                    options_with_win('score', 100),
                );
                const host_win = test_sockets.receive_socket_as(host_socket, 'game:win');
                const user2_win = test_sockets.receive_socket_as(user2_socket, 'game:win');

                test_game.mutate_player_in_game(app, host, { score: 200 });
                test_game.mutate_player_in_game(app, user2, { score: 200 });

                await Promise.all([host_win, user2_win]);
                expect_game_finished(game_id, host, [], [host.player_id, user2.player_id]);
            } finally {
                test_sockets.close_socket_client(host_socket);
                test_sockets.close_socket_client(user2_socket);
            }
        });
    });

    function options_with_win(
        condition: GameOptions['win']['condition'],
        limit: number | null,
    ): GameOptions {
        return {
            ...CLASSIC_OPTS,
            win: {
                condition,
                limit,
            },
        };
    }

    function expect_game_finished(
        game_id: string,
        sample_user: test_types.TestAuthUser,
        loser_ids: string[],
        winner_ids: string[],
    ): void {
        const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
        expect(lobby_res.success).toBe(true);
        if (!lobby_res.success) throw new Error('Expected lobby to exist');
        expect(lobby_res.data.get_game_status()).toBe(gameStatusType.waiting);

        const active_res = app.store.get_active_game_store().get_active_game_by_lobby_id(game_id);
        expect(active_res.success).toBe(false);

        const sample_player_res = app.store.get_player_store().get_player_by_id(sample_user.player_id);
        expect(sample_player_res.success).toBe(true);
        if (!sample_player_res.success) throw new Error('Expected player to exist');
        expect(sample_player_res.data.get_player_status()).toBe(playerStatusType.waiting);

        for (const id of loser_ids) {
            const player_res = app.store.get_player_store().get_player_by_id(id);
            expect(player_res.success).toBe(true);
            if (!player_res.success) throw new Error('Expected loser player to exist');
            expect(player_res.data.get_player_status()).toBe(playerStatusType.waiting);
        }

        for (const id of winner_ids) {
            const player_res = app.store.get_player_store().get_player_by_id(id);
            expect(player_res.success).toBe(true);
            if (!player_res.success) throw new Error('Expected winner player to exist');
            expect(player_res.data.get_player_status()).toBe(playerStatusType.waiting);
        }
    }
});
