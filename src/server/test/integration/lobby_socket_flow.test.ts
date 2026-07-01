import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { inject_as, register_user, unique_username } from '../helpers/test.auth_helpers.js';
import {
    close_socket_client,
    receive_socket_as,
    register_ready_socket_client,
    send_socket_as,
    start_socket_server,
    close_socket_server,
} from '../helpers/test.socket_helpers.js';
import type { TestAuthUser, TestSocketClient } from '../test.types.js';
import { gameStatusType, playerStatusType } from '../../types/status_types.js';

async function createGame(
    app: FastifyInstance,
    user: TestAuthUser,
    game_mode = 'classic',
) {
    const res = await inject_as(app, user, {
        method: 'POST',
        url: '/game/create',
        payload: { game_mode },
    });

    expect(res.statusCode).toBe(201);
    return res.json().game_id as string;
}

async function joinGame(socket: TestSocketClient, game_id: string) {
    const p = receive_socket_as(socket, 'lobby:join:success');
    send_socket_as(socket, 'lobby:join', { game_id });
    await p;
}

async function ready(socket: TestSocketClient) {
    const p = receive_socket_as(socket, 'lobby:ready:success');
    send_socket_as(socket, 'lobby:ready');
    await p;
}

async function logoutUser(app: FastifyInstance, user: TestAuthUser) {
    const player_res = app.store.get_player_store().get_player_by_id(user.player_id);
    if (!player_res.success)
        return;
    await inject_as(app, user, {
        method: 'GET',
        url: '/auth/logout',
    });
}

describe('integration: lobby socket flow', () => {
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

    describe('lobby:join', () => {
        it('returns error when game_id is missing', async () => {
            const user = await register_user(app, unique_username('join_missing_gid'));
            const { socket } = await register_ready_socket_client(baseUrl, user);
            try {
                const p = receive_socket_as(socket, 'lobby:join:error');
                send_socket_as(socket, 'lobby:join');
                const msg = await p;
                expect(msg.reason).toBe('missing game id');
            } finally {
                await logoutUser(app, user);
                close_socket_client(socket);
            }
        });

        it('returns error when game does not exist', async () => {
            const user = await register_user(app, unique_username('join_missing_lobby'));
            const { socket } = await register_ready_socket_client(baseUrl, user);
            try {
                const p = receive_socket_as(socket, 'lobby:join:error');
                send_socket_as(socket, 'lobby:join', { game_id: 'fake_id' });
                const msg = await p;
                expect(msg.reason).toBe('lobby not found');
            } finally {
                await logoutUser(app, user);
                close_socket_client(socket);
            }
        });

        it('returns error when game is solo and already full', async () => {
            const owner = await register_user(app, unique_username('create_solo'));
            const game_id = await createGame(app, owner, 'solo');

            const user = await register_user(app, unique_username('join_solo'));
            const { socket } = await register_ready_socket_client(baseUrl, user);

            try {
                const p = receive_socket_as(socket, 'lobby:join:error');
                send_socket_as(socket, 'lobby:join', { game_id });
                const msg = await p;
                expect(msg.reason).toBe('lobby is not joinable for now');
            } finally {
                await logoutUser(app, owner);
                await logoutUser(app, user);
                close_socket_client(socket);
            }
        });

        it('returns error when player is already in the game', async () => {
            const user = await register_user(app, unique_username('join_twice'));
            const game_id = await createGame(app, user, 'classic');
            const { socket } = await register_ready_socket_client(baseUrl, user);

            try {
                const p = receive_socket_as(socket, 'lobby:join:error');
                send_socket_as(socket, 'lobby:join', { game_id });
                const msg = await p;
                expect(msg.reason).toBe('player is already in a lobby');
            } finally {
                await logoutUser(app, user);
                close_socket_client(socket);
            }
        });

        it('returns error when multiplayer game is full', async () => {
            const owner = await register_user(app, unique_username('full_owner'));
            const game_id = await createGame(app, owner, 'easy');

            const second = await register_user(app, unique_username('full_second'));
            const third = await register_user(app, unique_username('full_third'));
            const { socket: secondSocket } = await register_ready_socket_client(baseUrl, second);
            const { socket: thirdSocket } = await register_ready_socket_client(baseUrl, third);

            try {
                await joinGame(secondSocket, game_id);

                const p = receive_socket_as(thirdSocket, 'lobby:join:error');
                send_socket_as(thirdSocket, 'lobby:join', { game_id });
                const msg = await p;
                expect(msg.reason).toBe('lobby is not joinable for now');
            } finally {
                await logoutUser(app, owner);
                await logoutUser(app, second);
                await logoutUser(app, third);
                close_socket_client(secondSocket);
                close_socket_client(thirdSocket);
            }
        });

        it('succeeds when joining an open multiplayer game', async () => {
            const owner = await register_user(app, unique_username('join_ok_owner'));
            const game_id = await createGame(app, owner, 'classic');

            const joiner = await register_user(app, unique_username('join_ok_user'));
            const { socket } = await register_ready_socket_client(baseUrl, joiner);

            try {
                await joinGame(socket, game_id);

                const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
                expect(lobby_res.success).toBe(true);
                if (!lobby_res.success)
                    throw new Error('Expected lobby to exist');
                expect(lobby_res.data.has_player(joiner.player_id)).toBe(true);
            } finally {
                await logoutUser(app, owner);
                await logoutUser(app, joiner);
                close_socket_client(socket);
            }
        });
    });

    describe('lobby:start', () => {
        it('returns error when user is not in a game', async () => {
            const user = await register_user(app, unique_username('start_no_game'));
            const { socket } = await register_ready_socket_client(baseUrl, user);

            try {
                const p = receive_socket_as(socket, 'lobby:start:error');
                send_socket_as(socket, 'lobby:start');
                const msg = await p;
                expect(msg.reason).toBe('Not all players are ready');
            } finally {
                await logoutUser(app, user);
                close_socket_client(socket);
            }
        });

        it('returns error when user is not owner', async () => {
            const owner = await register_user(app, unique_username('start_owner'));
            const game_id = await createGame(app, owner, 'classic');

            const joiner = await register_user(app, unique_username('start_not_owner'));
            const { socket: ownerSocket } = await register_ready_socket_client(baseUrl, owner);
            const { socket: joinerSocket } = await register_ready_socket_client(baseUrl, joiner);

            try {
                await joinGame(joinerSocket, game_id);
                await ready(ownerSocket);
                await ready(joinerSocket);

                const p = receive_socket_as(joinerSocket, 'lobby:start:error');
                send_socket_as(joinerSocket, 'lobby:start');
                const msg = await p;
                expect(msg.reason).toBe('user is not lobby owner');
            } finally {
                await logoutUser(app, owner);
                await logoutUser(app, joiner);
                close_socket_client(ownerSocket);
                close_socket_client(joinerSocket);
            }
        });

        it('succeeds for owner in solo game', async () => {
            const owner = await register_user(app, unique_username('start_solo_owner'));
            const game_id = await createGame(app, owner, 'solo');
            const { socket } = await register_ready_socket_client(baseUrl, owner);

            try {
                await ready(socket);

                const p = receive_socket_as(socket, 'lobby:start:success');
                send_socket_as(socket, 'lobby:start');
                await p;

                const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
                expect(lobby_res.success).toBe(true);
                if (!lobby_res.success)
                    throw new Error('Expected lobby to exist');
                expect(lobby_res.data.get_game_status()).toBe(gameStatusType.started);
            } finally {
                await logoutUser(app, owner);
                close_socket_client(socket);
            }
        });

        it('succeeds for owner in multiplayer game', async () => {
            const owner = await register_user(app, unique_username('start_multi_owner'));
            const game_id = await createGame(app, owner, 'classic');

            const joiner = await register_user(app, unique_username('start_multi_joiner'));
            const { socket: ownerSocket } = await register_ready_socket_client(baseUrl, owner);
            const { socket: joinerSocket } = await register_ready_socket_client(baseUrl, joiner);

            try {
                await joinGame(joinerSocket, game_id);
                await ready(ownerSocket);
                await ready(joinerSocket);

                const ownerStart = receive_socket_as(ownerSocket, 'lobby:start:success');
                const joinerStart = receive_socket_as(joinerSocket, 'lobby:start:success');

                send_socket_as(ownerSocket, 'lobby:start');

                await ownerStart;
                await joinerStart;

                const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
                expect(lobby_res.success).toBe(true);
                if (!lobby_res.success)
                    throw new Error('Expected lobby to exist');
                expect(lobby_res.data.get_game_status()).toBe(gameStatusType.started);
            } finally {
                await logoutUser(app, owner);
                await logoutUser(app, joiner);
                close_socket_client(ownerSocket);
                close_socket_client(joinerSocket);
            }
        });
    });

    describe('lobby:leave', () => {
        it('returns error when user is not in a game', async () => {
            const user = await register_user(app, unique_username('leave_no_game'));
            const { socket } = await register_ready_socket_client(baseUrl, user);

            try {
                const p = receive_socket_as(socket, 'lobby:leave:error');
                send_socket_as(socket, 'lobby:leave');
                const msg = await p;
                expect(msg.reason).toBe('player not found');
            } finally {
                await logoutUser(app, user);
                close_socket_client(socket);
            }
        });

        it('deletes solo game when owner leaves', async () => {
            const owner = await register_user(app, unique_username('leave_solo_owner'));
            const game_id = await createGame(app, owner, 'solo');
            const { socket } = await register_ready_socket_client(baseUrl, owner);

            try {
                const p = receive_socket_as(socket, 'lobby:leave:success');
                send_socket_as(socket, 'lobby:leave');
                await p;

                const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
                expect(lobby_res.success).toBe(false);
            } finally {
                await logoutUser(app, owner);
                close_socket_client(socket);
            }
        });

        it('deletes multiplayer game when empty', async () => {
            const owner = await register_user(app, unique_username('leave_multi_empty_owner'));
            const game_id = await createGame(app, owner, 'classic');
            const { socket } = await register_ready_socket_client(baseUrl, owner);

            try {
                const p = receive_socket_as(socket, 'lobby:leave:success');
                send_socket_as(socket, 'lobby:leave');
                await p;

                const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
                expect(lobby_res.success).toBe(false);
            } finally {
                await logoutUser(app, owner);
                close_socket_client(socket);
            }
        });

        it('removes non-owner from multiplayer game', async () => {
            const owner = await register_user(app, unique_username('leave_non_owner_owner'));
            const game_id = await createGame(app, owner, 'classic');

            const joiner = await register_user(app, unique_username('leave_non_owner_joiner'));
            const { socket: ownerSocket } = await register_ready_socket_client(baseUrl, owner);
            const { socket: joinerSocket } = await register_ready_socket_client(baseUrl, joiner);

            try {
                await joinGame(joinerSocket, game_id);

                const leaveSuccess = receive_socket_as(joinerSocket, 'lobby:leave:success');
                const leaveUpdate = receive_socket_as(ownerSocket, 'lobby:leave:update');

                send_socket_as(joinerSocket, 'lobby:leave');

                await leaveSuccess;
                const update = await leaveUpdate;

                expect(update.players.some((player) => player.username === joiner.username)).toBe(false);
                expect(update.players.some((player) => player.username === owner.username)).toBe(true);

                const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
                expect(lobby_res.success).toBe(true);
                if (!lobby_res.success)
                    throw new Error('Expected lobby to exist');
                expect(lobby_res.data.get_owner_id()).toBe(owner.player_id);
                expect(lobby_res.data.has_player(owner.player_id)).toBe(true);
                expect(lobby_res.data.has_player(joiner.player_id)).toBe(false);
            } finally {
                await logoutUser(app, owner);
                await logoutUser(app, joiner);
                close_socket_client(ownerSocket);
                close_socket_client(joinerSocket);
            }
        });

        it('transfers ownership when owner leaves multiplayer game', async () => {
            const owner = await register_user(app, unique_username('leave_owner_transfer_owner'));
            const game_id = await createGame(app, owner, 'classic');

            const nextOwner = await register_user(app, unique_username('leave_owner_transfer_next'));
            const { socket: ownerSocket } = await register_ready_socket_client(baseUrl, owner);
            const { socket: nextOwnerSocket } = await register_ready_socket_client(baseUrl, nextOwner);

            try {
                await joinGame(nextOwnerSocket, game_id);

                const newOwner = receive_socket_as(nextOwnerSocket, 'lobby:new_owner');
                const leaveUpdate = receive_socket_as(nextOwnerSocket, 'lobby:leave:update');
                const leaveSuccess = receive_socket_as(ownerSocket, 'lobby:leave:success');

                send_socket_as(ownerSocket, 'lobby:leave');

                await newOwner;
                const update = await leaveUpdate;
                await leaveSuccess;

                expect(update.owner_name).toBe(nextOwner.username);
                expect(update.players.some((player) => player.username === owner.username)).toBe(false);
                expect(update.players.some((player) => player.username === nextOwner.username && player.is_owner)).toBe(true);

                const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
                expect(lobby_res.success).toBe(true);
                if (!lobby_res.success)
                    throw new Error('Expected lobby to exist');
                expect(lobby_res.data.get_owner_id()).toBe(nextOwner.player_id);
                expect(lobby_res.data.has_player(owner.player_id)).toBe(false);
                expect(lobby_res.data.has_player(nextOwner.player_id)).toBe(true);
            } finally {
                await logoutUser(app, owner);
                await logoutUser(app, nextOwner);
                close_socket_client(ownerSocket);
                close_socket_client(nextOwnerSocket);
            }
        });
    });
});
