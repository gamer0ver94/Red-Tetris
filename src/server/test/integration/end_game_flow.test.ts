import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { CLASSIC_OPTS } from '../../types/pre_made_options.js';
import type { GameOptions } from '../../types/game_options_types.js';
import { gameStatusType, playerStatusType } from '../../types/status_types.js';
import { register_user, unique_username } from '../helpers/auth_helpers.test.js';
import {
    close_socket_client,
    close_socket_server,
    receive_socket_as,
    register_ready_socket_client,
    start_socket_server,
} from '../helpers/socket_helpers.test.js';
import {
    create_and_start_game,
    mutate_player_in_game,
} from '../helpers/game_helpers.test.js';
import type { TestAuthUser, TestSocketClient } from '../types.test.js';

describe('integration: end game flow', () => {
    let baseUrl: string;
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
        process.env.CLIENT_ORIGIN = 'http://localhost:1700';
        app = await build_server();
        baseUrl = await start_socket_server(app);
    });

    afterAll(async () => {
        await close_socket_server(app);
    });

    describe('game dead flow', () => {
        it('stop game when solo dies', async() => {
            const { user: host, socket: host_socket } = await register_player('solo_dead');

            try {
                const game_id = await create_and_start_game(app, host, host_socket, 'solo', []);
                const lose = receive_socket_as(host_socket, 'game:lose');

                mutate_player_in_game(app, host, { lost: true });

                await lose;
                expect_game_finished(game_id, host, [host.player_id], []);
            } finally {
                close_socket_client(host_socket);
            }
        });

        it('stop game when only one remains', async() => {
            const { user: host, socket: host_socket } = await register_player('survival_host');
            const { user: user2, socket: user2_socket } = await register_player('survival_2');
            const { user: user3, socket: user3_socket } = await register_player('survival_3');

            try {
                const game_id = await create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [user2_socket, user3_socket],
                    options_with_win('survival', null),
                );
                const host_win = receive_socket_as(host_socket, 'game:win');
                const user2_lose = receive_socket_as(user2_socket, 'game:lose');
                const user3_lose = receive_socket_as(user3_socket, 'game:lose');

                mutate_player_in_game(app, user2, { lost: true });
                mutate_player_in_game(app, user3, { lost: true });

                await Promise.all([host_win, user2_lose, user3_lose]);
                expect_game_finished(game_id, host, [user2.player_id, user3.player_id], [host.player_id]);
            } finally {
                close_socket_client(host_socket);
                close_socket_client(user2_socket);
                close_socket_client(user3_socket);
            }
        });

        it('stop game if all dead', async() => {
            const { user: host, socket: host_socket } = await register_player('all_dead_host');
            const { user: user2, socket: user2_socket } = await register_player('all_dead_2');

            try {
                const game_id = await create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [user2_socket],
                    options_with_win('survival', null),
                );
                const host_win = receive_socket_as(host_socket, 'game:win');
                const user2_lose = receive_socket_as(user2_socket, 'game:lose');

                mutate_player_in_game(app, host, { lost: true, score: 20 });
                mutate_player_in_game(app, user2, { lost: true, score: 10 });

                await Promise.all([host_win, user2_lose]);
                expect_game_finished(game_id, host, [user2.player_id], [host.player_id]);
            } finally {
                close_socket_client(host_socket);
                close_socket_client(user2_socket);
            }
        });
    });

    describe('game limit flow', () => {
        it('stop game at time limit', async() => {
            const { user: host, socket: host_socket } = await register_player('time_limit');

            try {
                const game_id = await create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [],
                    options_with_win('time', 80),
                );
                const win = receive_socket_as(host_socket, 'game:win', 1500);

                await win;
                expect_game_finished(game_id, host, [], [host.player_id]);
            } finally {
                close_socket_client(host_socket);
            }
        });

        it('stop game at score limit', async() =>{
            const { user: host, socket: host_socket } = await register_player('score_limit');

            try {
                const game_id = await create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [],
                    options_with_win('score', 100),
                );
                const win = receive_socket_as(host_socket, 'game:win');

                mutate_player_in_game(app, host, { score: 100 });

                await win;
                expect_game_finished(game_id, host, [], [host.player_id]);
            } finally {
                close_socket_client(host_socket);
            }
        });

        it('stop game at lines limit', async() => {
            const { user: host, socket: host_socket } = await register_player('lines_limit');

            try {
                const game_id = await create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [],
                    options_with_win('lines', 1),
                );
                const win = receive_socket_as(host_socket, 'game:win');

                mutate_player_in_game(app, host, { lines: 1 });

                await win;
                expect_game_finished(game_id, host, [], [host.player_id]);
            } finally {
                close_socket_client(host_socket);
            }
        });

        it('allowed multiple winner on score tie', async() => {
            const { user: host, socket: host_socket } = await register_player('tie_host');
            const { user: user2, socket: user2_socket } = await register_player('tie_2');

            try {
                const game_id = await create_and_start_game(
                    app,
                    host,
                    host_socket,
                    'custom',
                    [user2_socket],
                    options_with_win('score', 100),
                );
                const host_win = receive_socket_as(host_socket, 'game:win');
                const user2_win = receive_socket_as(user2_socket, 'game:win');

                mutate_player_in_game(app, host, { score: 200 });
                mutate_player_in_game(app, user2, { score: 200 });

                await Promise.all([host_win, user2_win]);
                expect_game_finished(game_id, host, [], [host.player_id, user2.player_id]);
            } finally {
                close_socket_client(host_socket);
                close_socket_client(user2_socket);
            }
        });
    });

    async function register_player(prefix: string): Promise<{ user: TestAuthUser; socket: TestSocketClient }> {
        const user = await register_user(app, unique_username(prefix));
        const { socket } = await register_ready_socket_client(baseUrl, user);
        return { user, socket };
    }

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
        sample_user: TestAuthUser,
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
