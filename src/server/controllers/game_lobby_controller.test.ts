import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { register_user, unique_username, inject_as } from '../test/helpers/auth_helpers_test.ts';
import { build_server } from '../app/build_server.ts';
import type { TestAuthUser } from '../test/test_types.ts';

describe('controller: lobby', () => {
    
    let app:FastifyInstance;
    let tester_create:TestAuthUser;

    beforeAll(async() => {
        //create app
        process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
        process.env.CLIENT_ORIGIN = 'http://localhost:1700';
        app = await build_server();

        //create  user(create_tester), (token_tester)
        tester_create = await register_user(app, 'tester_create');
    });

    afterAll(async () => {
        //close app
        await app.close();
    });

    describe('controller: lobby: create', () => {
        
        it('create legit game and updates stores', async () => {
            //inject as lobby_route_tester, POST create game
            const res = await inject_as(app, tester_create,{
                method:'POST',
                url:'/game/create',
                payload: {
                    game_type:'multi_player',
                    game_mode:'classic'
                }
            });
            //Route return
            expect(res.statusCode).toBe(201);
            const body = res.json();
            expect(body.success).toBe(true);
            expect(body.game_id).toBeDefined();
            expect(body.game_type).toBe('multi_player');
            expect(body.game_mode).toBe('classic');
            
            //Check in game memory
            const game = await app.store.get_game_store().get_game_by_id(body.game_id);
            expect(game).toBeDefined();
            expect(game?.get_owner_id()).toBe(tester_create.player_id);
            expect(game?.get_game_type()).toBe('multi_player');
            expect(game?.get_game_mode()).toBe('classic');
            expect(game?.get_game_status()).toBe('waiting');
            expect(game?.get_player_ids().has(tester_create.player_id)).toBe(true);
            
            //Check in players memory
            const player = await app.store.get_player_store().get_player_by_id(tester_create.player_id);
            expect(player).toBeDefined();
            expect(player?.get_player_status()).toBe('waiting');
        });

        it('returns 409 when the same player tries to create twice', async () => {
            //re inject as create_tester
            const res = await inject_as(app, tester_create,{
                method:'POST',
                url:'/game/create',
                payload: {
                    game_type:'multi_player',
                    game_mode:'classic',
                }
            });
            expect(res.statusCode).toBe(409);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.reason).toContain('already in a game');
        });

        it ('returns 403 when sid missing', async () => {
            //inject as no one
            const res = await app.inject({
                method: 'POST',
                url: '/game/create',
                headers: {
                'x-csrf-token': 'x'.repeat(32),
                },
                payload: {
                game_type: 'multi_player',
                game_mode: 'classic',
                },
            }); 
            expect(res.statusCode).toBe(403);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.reason).toContain('Missing sid');
        });

        it('returns 403 with missing csrf', async () => {
            const user = await register_user(app, 'csrf_missing_test');

            const res = await app.inject( {
                method: 'POST',
                url: '/game/create',
                headers:{
                    cookie:user.cookie,
                },
                payload:{
                    game_type:'multi_player',
                    game_mode: 'classic',
                },
            });
            expect(res.statusCode).toBe(403);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.reason).toContain('Token manipulation');
        });

        it('returns 403 with wrong csrf', async() => {
            const user = await register_user(app, 'wrong_csrf_test');

            const res = await inject_as(app, user, {
                method:'POST',
                url:'/game/create',
                headers:{
                    'x-csrf-token': 'f'.repeat(32)
                },
                payload:{
                    game_type:'single_player',
                    game_mode:'classic',
                },
            });
            expect(res.statusCode).toBe(403);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.reason).toBe('Token manipulation')
        });
    });

    describe('controller: lobby: join', () => {
        
        it('returns 403 if no sid', async () => {
            
            const res = await app.inject({
                method: 'GET',
                url: '/game/join/fake_game/someone',
            });

            expect(res.statusCode).toBe(403);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.reason).toBe('Missing sid');
        });

        it('returns 404 if no player found', async () => {
            const ghost = await register_user(app, unique_username('ghost_join'));
            await app.store.get_player_store().remove_player(
                (await app.store.get_player_store().get_player_by_id(ghost.player_id))!
            );

            const res = await app.inject({
                method:'GET',
                url:`/game/join/fake_game/${ghost.username}`,
                headers: {cookie: ghost.cookie}
            });

            expect(res.statusCode).toBe(404);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.reason).toBe('No player found');
        });

        it(`returns 403 if username don't match`, async () => {
            const user = await register_user(app, unique_username('wrong_name'));

            const res = await inject_as(app, user,{
                method:'GET',
                url:'/game/join/fake_game/wrong_username',
            });

            expect(res.statusCode).toBe(403);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.reason).toBe('Wrong username')
        });

        it('returns 404 when no game found', async () => {
            const user = await register_user(app, unique_username('join_no_game'));

            const res = await inject_as(app, user, {
                method: 'GET',
                url: `/game/join/fake_game/${user.username}`,
            });
            
            expect(res.statusCode).toBe(404);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.reason).toBe('Game not found');
        });

        it('returns 409 if game started', async() => {
            const owner = await register_user(app, unique_username('join_started_owner'));

            const createRes = await inject_as(app, owner, {
                method: 'POST',
                url: '/game/create',
                payload: {
                game_type: 'multi_player',
                game_mode: 'classic',
                },
            });
            expect(createRes.statusCode).toBe(201);
            const gameId = createRes.json().game_id as string;
            expect(gameId).toBeDefined();

            const game = await app.store.get_game_store().get_game_by_id(gameId);
            expect(game).toBeDefined();

            game!.set_game_status('started');
            expect(game!.get_game_status()).toBe('started');

            const joiner = await register_user(app, unique_username('join_started_user'));

            const res = await inject_as(app, joiner, {
                method: 'GET',
                url: `/game/join/${gameId}/${joiner.username}`,
            });

            expect(res.statusCode).toBe(409);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.reason).toBe('Game already started');
        });

        it('returns join metadata when game is waiting', async () => {
            const owner = await register_user(app, unique_username('join_meta_owner'));

            const createRes = await inject_as(app, owner, {
                method: 'POST',
                url: '/game/create',
                payload: {
                game_type: 'multi_player',
                game_mode: 'classic',
                },
            });
            expect(createRes.statusCode).toBe(201);
            const gameId = createRes.json().game_id as string;

            const joiner = await register_user(app, unique_username('join_meta_user'));

            const res = await app.inject({
                method: 'GET',
                url: `/game/join/${gameId}/${joiner.username}`,
                headers: { cookie: joiner.cookie },
            });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.success).toBe(true);
            expect(body.game_id).toBe(gameId);
            expect(body.player_id).toBe(joiner.player_id);
            expect(body.username).toBe(joiner.username);
            expect(body.csrf_token).toBe(joiner.csrf_token);
            expect(body.game_status).toBe('waiting');
            expect(body.is_host).toBe(false);
        });
    });
});
