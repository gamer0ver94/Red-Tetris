import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { register_user, unique_username, inject_as } from '../helpers/auth_helpers.test.js';
import { build_server } from '../../app/build_server.js';
import type { TestAuthUser } from '../types.test.js';
import { gameStatusType, playerStatusType } from '../../types/status_types.js';

describe('integration: game routes flow', () => {
    let app: FastifyInstance;
    let tester_create: TestAuthUser;

    beforeAll(async () => {
        process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
        process.env.CLIENT_ORIGIN = 'http://localhost:1700';
        app = await build_server();
        tester_create = await register_user(app, unique_username('tester_create'));
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/game/create', () => {
        it('creates a legit game and updates stores', async () => {
            const res = await inject_as(app, tester_create, {
                method: 'POST',
                url: '/game/create',
                payload: { game_mode: 'classic' },
            });

            const body = res.json();

            expect(res.statusCode).toBe(201);
            expect(body.success).toBe(true);
            expect(body.game_id).toBeDefined();

            const lobby_res = app.store.get_lobby_store().get_lobby_by_id(body.game_id);
            expect(lobby_res.success).toBe(true);
            if (!lobby_res.success)
                throw new Error('Expected lobby to exist');

            expect(lobby_res.data.get_owner_id()).toBe(tester_create.player_id);
            expect(lobby_res.data.get_game_mode()).toBe('classic');
            expect(lobby_res.data.get_game_status()).toBe(gameStatusType.waiting);
            expect(lobby_res.data.has_player(tester_create.player_id)).toBe(true);

            const player_res = app.store.get_player_store().get_player_by_id(tester_create.player_id);
            expect(player_res.success).toBe(true);
            if (!player_res.success)
                throw new Error('Expected player to exist');
            expect(player_res.data.get_player_status()).toBe(playerStatusType.waiting);
        });

        it('returns 409 when the same player tries to create twice', async () => {
            const res = await inject_as(app, tester_create, {
                method: 'POST',
                url: '/game/create',
                payload: { game_mode: 'classic' },
            });
            const body = res.json();

            expect(res.statusCode).toBe(409);
            expect(body.success).toBe(false);
            expect(body.code).toBe('PLAYER_IN_LOBBY');
            expect(body.message).toBeDefined();
        });

        it('returns 403 when sid is missing', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/game/create',
                headers: { 'x-csrf-token': 'x'.repeat(32) },
                payload: { game_mode: 'classic' },
            });
            const body = res.json();

            expect(res.statusCode).toBe(403);
            expect(body.success).toBe(false);
            expect(body.code).toBe('SID_MISSING');
            expect(body.message).toBeDefined();
        });

        it('returns 403 with missing csrf', async () => {
            const user = await register_user(app, unique_username('csrf_missing_test'));

            const res = await app.inject({
                method: 'POST',
                url: '/game/create',
                headers: { cookie: user.cookie },
                payload: { game_mode: 'classic' },
            });
            const body = res.json();

            expect(res.statusCode).toBe(403);
            expect(body.success).toBe(false);
            expect(body.code).toBe('CSRF_MANIP');
            expect(body.message).toBeDefined();
        });

        it('returns 403 with wrong csrf', async () => {
            const user = await register_user(app, unique_username('wrong_csrf_test'));

            const res = await inject_as(app, user, {
                method: 'POST',
                url: '/game/create',
                headers: { 'x-csrf-token': 'f'.repeat(32) },
                payload: { game_mode: 'classic' },
            });
            const body = res.json();

            expect(res.statusCode).toBe(403);
            expect(body.success).toBe(false);
            expect(body.code).toBe('CSRF_MANIP');
            expect(body.message).toBeDefined();
        });
    });

    describe('/game/join/:game_id/:username', () => {
        it('returns 403 if no sid', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/game/join/fake_game/someone',
            });
            const body = res.json();

            expect(res.statusCode).toBe(403);
            expect(body.success).toBe(false);
            expect(body.code).toBe('SID_NOT_FOUND');
            expect(body.message).toBeDefined();
        });

        it('returns 404 if no player found', async () => {
            const ghost = await register_user(app, unique_username('ghost_join'));
            const player_res = app.store.get_player_store().get_player_by_id(ghost.player_id);
            if (!player_res.success)
                throw new Error('Expected ghost player to exist before removal');
            app.store.get_player_store().remove_player(player_res.data);

            const res = await app.inject({
                method: 'GET',
                url: `/game/join/fake_game/${ghost.username}`,
                headers: { cookie: ghost.cookie },
            });
            const body = res.json();

            expect(res.statusCode).toBe(404);
            expect(body.success).toBe(false);
            expect(body.code).toBe('PLAYER_NOT_FOUND');
            expect(body.message).toBeDefined();
        });

        it("returns 403 if username doesn't match", async () => {
            const user = await register_user(app, unique_username('wrong_name'));

            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/game/join/fake_game/wrong_username',
            });
            const body = res.json();

            expect(res.statusCode).toBe(403);
            expect(body.success).toBe(false);
            expect(body.code).toBe('USERNAME_MISMATCH');
            expect(body.message).toBeDefined();
        });

        it('returns 404 when no game found', async () => {
            const user = await register_user(app, unique_username('join_no_game'));

            const res = await inject_as(app, user, {
                method: 'GET',
                url: `/game/join/fake_game/${user.username}`,
            });
            const body = res.json();

            expect(res.statusCode).toBe(404);
            expect(body.success).toBe(false);
            expect(body.code).toBe('LOBBY_NOT_FOUND');
            expect(body.message).toBeDefined();
        });

        it('returns 409 if game started', async () => {
            const owner = await register_user(app, unique_username('join_started_owner'));
            const create_res = await inject_as(app, owner, {
                method: 'POST',
                url: '/game/create',
                payload: { game_mode: 'classic' },
            });

            expect(create_res.statusCode).toBe(201);
            const game_id = create_res.json().game_id as string;

            const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
            expect(lobby_res.success).toBe(true);
            if (!lobby_res.success)
                throw new Error('Expected lobby to exist');

            lobby_res.data.set_game_status(gameStatusType.started);
            expect(lobby_res.data.get_game_status()).toBe(gameStatusType.started);

            const joiner = await register_user(app, unique_username('join_started_user'));
            const res = await inject_as(app, joiner, {
                method: 'GET',
                url: `/game/join/${game_id}/${joiner.username}`,
            });
            const body = res.json();

            expect(res.statusCode).toBe(409);
            expect(body.success).toBe(false);
            expect(body.code).toBe('LOBBY_CANNOT_JOIN');
            expect(body.message).toBeDefined();
        });

        it('returns join metadata when game is waiting', async () => {
            const owner = await register_user(app, unique_username('join_meta_owner'));
            const create_res = await inject_as(app, owner, {
                method: 'POST',
                url: '/game/create',
                payload: { game_mode: 'classic' },
            });

            expect(create_res.statusCode).toBe(201);
            const game_id = create_res.json().game_id as string;
            const joiner = await register_user(app, unique_username('join_meta_user'));

            const res = await app.inject({
                method: 'GET',
                url: `/game/join/${game_id}/${joiner.username}`,
                headers: { cookie: joiner.cookie },
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.game_id).toBe(game_id);
            expect(body.player_id).toBe(joiner.player_id);
            expect(body.username).toBe(joiner.username);
            expect(body.csrf_token).toBe(joiner.csrf_token);
            expect(body.game_status).toBe(gameStatusType.waiting);
            expect(body.is_host).toBe(false);
        });
    });
});
