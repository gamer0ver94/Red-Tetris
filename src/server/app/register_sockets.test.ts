import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from "./build_server.ts";
import { register_user, unique_username } from '../test/helpers/auth_helpers_test.ts';
import {
  close_socket_client,
  close_socket_server,
  receive_connect_error,
  register_socket_client,
  start_socket_server,
} from '../test/helpers/socket_helpers_test.ts';


describe('register_sockets', () => {

    let app: FastifyInstance;
    let baseUrl:string;

    beforeAll(async() => {
        process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
        process.env.CLIENT_ORIGIN = 'http://localhost:1700';
        app = await build_server();
        baseUrl = await start_socket_server(app);
    });

    afterAll(async () => {await close_socket_server(app)});

    it('connects with valid session + csrf', async() => {
        const user = await register_user(app, unique_username('socket_ok'));
        const socket = await register_socket_client(baseUrl, user);
        try{
            expect(socket.connected).toBe(true);
            const player = await app.store.get_player_store().get_player_by_id(user.player_id);
            expect(player?.get_player_status()).toBe('connected');
        }
        finally{
            close_socket_client(socket);
        }
    });

    it('rejects missing csrf token', async() => {
        const user = await register_user(app, unique_username('no_token_socket'));
        const socket = await register_socket_client(baseUrl, user, {
            csrf_token:'',
            wait_for_connect: false,
        });

        try{
            const reason = await receive_connect_error(socket);
            expect(reason).toBe('missing csrf token');
        }
        finally{
            close_socket_client(socket);
        }
    });

    it('rejects wrong csrf token', async() => {
        const user = await register_user(app, unique_username('wrong_token_socket'));
        const socket = await register_socket_client(baseUrl, user, {
            csrf_token:'Wrong TOKEN',
            wait_for_connect:false
        });
        try{
            const reason = await receive_connect_error(socket);
            expect(reason).toBe('forbidden');
        }
        finally{
            close_socket_client(socket);
        }
    });

    it('rejects missing session cookie', async() => {
        const user = await register_user(app, unique_username('no_sid_socket'));
        const socket = await register_socket_client(baseUrl, user, {
            wait_for_connect:false,
            cookie:''
        });
        try{
            const reason = await receive_connect_error(socket);
            expect(reason).toBe('missing session')
        }
        finally{
            close_socket_client(socket);
        }
    });
});
