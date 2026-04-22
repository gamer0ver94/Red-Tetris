import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { build_server } from '../app/build_server.ts';
import { register_user, unique_username, inject_as } from '../test/helpers/auth_helpers_test.ts';

describe('controller: auth', () =>{

    let app: FastifyInstance;

    beforeAll(async() => {
        process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
        process.env.CLIENT_ORIGIN = 'http://localhost:1700';
        app = await build_server();
    });

    afterAll(async() => {
        await app.close();
    });

    describe('controller: auth: get_me', async () => {

        it('return is_know:false when no sid', async() => {
            const res = await app.inject({
                method:'GET',
                url: '/auth/me',
            });
            expect(res.json().is_known).toBe(false);
        });

        it('return player meta if sid if found', async() => {
            const user = await register_user(app, unique_username('test_me'));
            const res = await app.inject({
                method:'GET',
                url:'/auth/me',
                headers: {cookie: user.cookie}
            });
            const body = res.json();
            expect(res.statusCode).toBe(200)
            expect(body.is_known).toBe(true);
            expect(body.username).toBe(user.username);
            expect(body.player_id).toBeDefined();
            expect(body.socket_id).toBeDefined();
            expect(body.csrf_token).toBeDefined();
            expect( body.player_status).toBeDefined();
        });
    });

    describe('controller: auth: register', async() =>{
       
        it('forbid access if sid is found', async() => {
            const user = await register_user(app, unique_username('test_sid'));
            const res = await inject_as(app, user, {
                method: 'POST',
                url: '/auth/register',
                payload: { username: unique_username('test')}
            });
            const body = res.json();
            expect(res.statusCode).toBe(409);
            expect(body.success).toBe(false);
            expect(body.reason).toBeDefined();
        });
       
        //remove sid from session
        it ('missing username', async() => {
            const res = await app.inject({
                method:'POST',
                payload:{
                    username:''
                },
                url:'/auth/register'
            });
            const body = res.json()
            expect(res.statusCode).toBe(400);
            expect(body.success).toBe(false);
            expect(body.reason).toBeDefined();
        });

        it('returns meta_data when success', async() => {
            const res = await app.inject({
                method:'POST',
                payload: {username: 'test_valid'},
                url:'/auth/register'
            });
            const body = res.json();
            expect(res.statusCode).toBe(201);
            expect(body.success).toBe(true);
            expect(body.username).toBe('test_valid');
            expect(body.player_status).toBe('waiting socket');
            expect(body.player_id, body.socket_id, body.csrf_token).toBeDefined();
        });

        it('forces unique usernames', async() =>{
            const valid_user = await register_user(app, 'valid_user');
            const res = await app.inject({
                method:'POST',
                payload: { username: 'valid_user'},
                url:'/auth/register'
            });
            const body = res.json();
            expect(res.statusCode).toBe(409);
            expect(body.success).toBe(false);
            expect(body.reason).toBeDefined();
        });

    });
});