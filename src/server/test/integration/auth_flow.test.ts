import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { register_user, unique_username, inject_as } from '../helpers/auth_helpers.test.js';

describe('integration: auth flow', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
        process.env.CLIENT_ORIGIN = 'http://localhost:1700';
        app = await build_server();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/me', () => {
        it('returns is_known:false when no sid', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/auth/me',
            });

            expect(res.statusCode).toBe(200);
            expect(res.json().is_known).toBe(false);
        });

        it('returns player metadata if sid is found', async () => {
            const user = await register_user(app, unique_username('test_me'));
            const res = await app.inject({
                method: 'GET',
                url: '/auth/me',
                headers: { cookie: user.cookie },
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.is_known).toBe(true);
            expect(body.username).toBe(user.username);
            expect(body.player_id).toBe(user.player_id);
            expect(body.socket_id).toBeDefined();
            expect(body.csrf_token).toBe(user.csrf_token);
            expect(body.player_status).toBeDefined();
        });
    });

    describe('/register', () => {
        it('forbids access if sid is found', async () => {
            const user = await register_user(app, unique_username('test_sid'));
            const res = await inject_as(app, user, {
                method: 'POST',
                url: '/auth/register',
                payload: { username: unique_username('test') },
            });
            const body = res.json();

            expect(res.statusCode).toBe(409);
            expect(body.success).toBe(false);
            expect(body.code).toBe('PLAYER_LOGIN');
            expect(body.message).toBeDefined();
        });

        it('rejects missing username', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: { username: '' },
            });
            const body = res.json();

            expect(res.statusCode).toBe(400);
            expect(body.success).toBe(false);
            expect(body.code).toBe('USERNAME_REQUIRED');
            expect(body.message).toBeDefined();
        });

        it('returns metadata when register succeeds', async () => {
            const username = unique_username('test_valid');
            const res = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: { username },
            });
            const body = res.json();

            expect(res.statusCode).toBe(201);
            expect(body.username).toBe(username);
            expect(body.player_status).toBe('waiting_socket');
            expect(body.player_id).toBeDefined();
            expect(body.socket_id).toBeDefined();
            expect(body.csrf_token).toBeDefined();
        });

        it('forces unique usernames', async () => {
            const username = unique_username('valid_user');
            await register_user(app, username);
            const res = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: { username },
            });
            const body = res.json();

            expect(res.statusCode).toBe(409);
            expect(body.success).toBe(false);
            expect(body.code).toBe('USERNAME_TAKEN');
            expect(body.message).toBeDefined();
        });
    });

    describe('/logout', () => {
        it('forbids access if no sid', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/auth/logout',
            });
            const body = res.json();

            expect(res.statusCode).toBe(403);
            expect(body.success).toBe(false);
            expect(body.code).toBe('SID_MISSING');
            expect(body.message).toBeDefined();
        });

        it('returns 403 if sid is valid but logout fails', async () => {
            const user = await register_user(app, unique_username('test_logout_fail'));
            const player_res = app.store.get_player_store().get_player_by_id(user.player_id);
            if (!player_res.success)
                throw new Error('Expected test player to exist');

            app.store.get_player_store().remove_player(player_res.data);

            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/auth/logout',
            });
            const body = res.json();

            expect(res.statusCode).toBe(403);
            expect(body.success).toBe(false);
            expect(body.code).toBe('PLAYER_NOT_FOUND');
            expect(body.message).toBeDefined();
        });

        it('allows logout if sid is valid', async () => {
            const user = await register_user(app, unique_username('test_logout_success'));
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/auth/logout',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.success).toBe(true);

            const player_res = app.store.get_player_store().get_player_by_id(user.player_id);
            expect(player_res.success).toBe(false);
        });

        it('allows logout and quits game while waiting', async () => {
            const user = await register_user(app, unique_username('test_logout_game_waiting'));
            const game_res = await inject_as(app, user, {
                method: 'POST',
                url: '/game/create',
                payload: { game_mode: 'classic' },
            });
            expect(game_res.statusCode).toBe(201);
            const game_id = game_res.json().game_id;

            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/auth/logout',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.success).toBe(true);

            const lobby_res = app.store.get_lobby_store().get_lobby_by_id(game_id);
            expect(lobby_res.success).toBe(false);

            const player_res = app.store.get_player_store().get_player_by_id(user.player_id);
            expect(player_res.success).toBe(false);
        });
    });
});
