import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../app/build_server.ts';
import { inject_as, register_user, unique_username } from '../test/helpers/auth_helpers_test.ts';
import {
  close_socket_client,
  receive_socket_as,
  register_ready_socket_client,
  send_socket_as,
  start_socket_server,
  close_socket_server
} from '../test/helpers/socket_helpers_test.ts';

import { TestAuthUser, TestSocketClient } from '../test/test_types.ts';


async function createGame(
  app:FastifyInstance,
  user: TestAuthUser,
  game_type: 'single_player' | 'multi_player' = 'multi_player',
) {
  const res = await inject_as(app, user, {
    method: 'POST',
    url: '/game/create',
    payload: { game_type, game_mode: 'classic' },
  });
  expect(res.statusCode).toBe(201);
  return res.json().game_id as string;
}

async function joinGame(socket: TestSocketClient, game_id: string) {
  const p = receive_socket_as(socket, 'lobby:join:success');
  send_socket_as(socket, 'lobby:join', { game_id });
  await p;
}

describe('socket_game_lobby', () => {

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
    
    it('returns error when game_id is missing', async() => {
      const user = await register_user(app, unique_username('join_missing_gid'));
      const { socket } = await register_ready_socket_client(baseUrl, user);
      try {
        const p = receive_socket_as(socket, 'lobby:join:error');
        send_socket_as(socket, 'lobby:join');
        const msg = await p;
        expect(msg.reason).toBe('missing game id');
      }
      finally {
        close_socket_client(socket);
      }
    });

    it('returns error when game does not exist', async() => {
      const user = await register_user(app, unique_username('join_missing_gid'));
      const { socket } = await register_ready_socket_client(baseUrl, user);
      try {
        const p = receive_socket_as(socket, 'lobby:join:error');
        send_socket_as(socket, 'lobby:join', {game_id:'fake_id'});
        const msg = await p;
        expect(msg.reason).toBe('game not found');
      }
      finally {
        close_socket_client(socket);
      }
    });

    it('returns error when game is single_player', async() => {
      const owner = await register_user(app, unique_username('create_single'));
      const game_id = await createGame(app, owner, 'single_player');

      const user = await register_user(app, unique_username('join_single_player'));
      const { socket } = await register_ready_socket_client(baseUrl, user);

      try {
        const p = receive_socket_as(socket, 'lobby:join:error');
        send_socket_as(socket, 'lobby:join', { game_id });
        const msg = await p;
        expect(msg.reason).toBe('game not found');
      } finally {
        close_socket_client(socket);
      }
    });

    it('returns error when player is already in the game', async() => {
      const user = await register_user(app, unique_username('join_twice'));
      const game_id = await createGame(app, user, 'multi_player');
      const { socket } = await register_ready_socket_client(baseUrl, user);

      try {
        const p = receive_socket_as(socket, 'lobby:join:error');
        send_socket_as(socket, 'lobby:join', { game_id });
        const msg = await p;
        expect(msg.reason).toBe("you can't join a game you are in");
      } finally {
        close_socket_client(socket);
      }
    });

    it('returns error when multiplayer game is full', async() => {
      const owner = await register_user(app, unique_username('full_owner'));
      const game_id = await createGame(app, owner, 'multi_player');

      const second = await register_user(app, unique_username('full_second'));
      const third = await register_user(app, unique_username('full_third'));
      const {socket:secondSocket} = await register_ready_socket_client(baseUrl, second);
      const {socket:thirdSocket} = await register_ready_socket_client(baseUrl, third);

      try {
        await joinGame(secondSocket, game_id);

        const p = receive_socket_as(thirdSocket, 'lobby:join:error');
        send_socket_as(thirdSocket, 'lobby:join', { game_id });
        const msg = await p;
        expect(msg.reason).toBe('the match is full');
      } finally {
        close_socket_client(secondSocket);
        close_socket_client(thirdSocket);
      }
    });

    it('succeeds when joining an open multiplayer game', async() => {
      const owner = await register_user(app, unique_username('join_ok_owner'));
      const game_id = await createGame(app, owner, 'multi_player');

      const joiner = await register_user(app, unique_username('join_ok_user'));
      const  { socket } = await register_ready_socket_client(baseUrl, joiner);

      try {
        await joinGame(socket, game_id);

        const game = await app.store.get_game_store().get_game_by_id(game_id);
        expect(game?.get_player_ids().has(joiner.player_id)).toBe(true);
      } finally {
        close_socket_client(socket);
      }
    });
  });

  describe('lobby:start', () => {
    
    it('returns error when user is not in a game', async() => {
      const user = await register_user(app, unique_username('start_no_game'));
      const { socket } = await register_ready_socket_client(baseUrl, user);

      try {
        const p = receive_socket_as(socket, 'lobby:start:error');
        send_socket_as(socket, 'lobby:start');
        const msg = await p;
        expect(msg.reason).toBe('game not found');
      } finally {
        close_socket_client(socket);
      }
    });
    
    it('returns error when user is not owner', async() => {
      const owner = await register_user(app, unique_username('start_owner'));
      const game_id = await createGame(app, owner, 'multi_player');

      const joiner = await register_user(app, unique_username('start_not_owner'));
      const { socket } = await register_ready_socket_client(baseUrl, joiner);

      try {
        await joinGame(socket, game_id);

        const p = receive_socket_as(socket, 'lobby:start:error');
        send_socket_as(socket, 'lobby:start');
        const msg = await p;
        expect(msg.reason).toBe("you can't start this game");
      } finally {
        close_socket_client(socket);
      }
    });
    it('succeeds for owner in single_player', async() => {
      const owner = await register_user(app, unique_username('start_single_owner'));
      const game_id = await createGame(app, owner, 'single_player');
      const { socket } = await register_ready_socket_client(baseUrl, owner);

      try {
        const p = receive_socket_as(socket, 'lobby:start:success');
        send_socket_as(socket, 'lobby:start');
        const msg = await p;

        expect(msg.data.game_id).toBe(game_id);

        const game = await app.store.get_game_store().get_game_by_id(game_id);
        expect(game?.get_game_status()).toBe('started');
      } finally {
        close_socket_client(socket);
      }
    });

    it('succeeds for owner in multi-player', async() => {
      const owner = await register_user(app, unique_username('start_multi_owner'));
      const game_id = await createGame(app, owner, 'multi_player');

      const joiner = await register_user(app, unique_username('start_multi_joiner'));
      const { socket: ownerSocket } = await register_ready_socket_client(baseUrl, owner);
      const { socket: joinerSocket } = await register_ready_socket_client(baseUrl, joiner);

      try {
        await joinGame(joinerSocket, game_id);

        const ownerStart = receive_socket_as(ownerSocket, 'lobby:start:success');
        const joinerStart = receive_socket_as(joinerSocket, 'lobby:start:success');

        send_socket_as(ownerSocket, 'lobby:start');

        const ownerMsg = await ownerStart;
        const joinerMsg = await joinerStart;

        expect(ownerMsg.data.game_id).toBe(game_id);
        expect(joinerMsg.data.game_id).toBe(game_id);

        const game = await app.store.get_game_store().get_game_by_id(game_id);
        expect(game?.get_game_status()).toBe('started');
      } finally {
        close_socket_client(ownerSocket);
        close_socket_client(joinerSocket);
      }
    })
  });

  describe('lobby:leave', () => {

    it('returns error when user is not in a game', async() => {
      const user = await register_user(app, unique_username('leave_no_game'));
      const { socket } = await register_ready_socket_client(baseUrl, user);

      try {
        const p = receive_socket_as(socket, 'lobby:leave:error');
        send_socket_as(socket, 'lobby:leave');
        const msg = await p;
        expect(msg.reason).toBe('game not found');
      } finally {
        close_socket_client(socket);
      }
    });

    it('deletes single-player game when owner leaves', async() => {
      const owner = await register_user(app, unique_username('leave_single_owner'));
      const game_id = await createGame(app, owner, 'single_player');
      const { socket } = await register_ready_socket_client(baseUrl, owner);

      try {
        const p = receive_socket_as(socket, 'lobby:leave:success');
        send_socket_as(socket, 'lobby:leave');
        await p;

        const game = await app.store.get_game_store().get_game_by_id(game_id);
        expect(game).toBeUndefined();
      } finally {
        close_socket_client(socket);
      }
    });

    it('deletes multi-player game when empty', async() => {
      const owner = await register_user(app, unique_username('leave_multi_empty_owner'));
      const game_id = await createGame(app, owner, 'multi_player');
      const { socket } = await register_ready_socket_client(baseUrl, owner);

      try {
        const p = receive_socket_as(socket, 'lobby:leave:success');
        send_socket_as(socket, 'lobby:leave');
        await p;

        const game = await app.store.get_game_store().get_game_by_id(game_id);
        expect(game).toBeUndefined();
      } finally {
        close_socket_client(socket);
      }
    });

    it('removes non-owner from multiplayer game', async() => {
      const owner = await register_user(app, unique_username('leave_non_owner_owner'));
      const game_id = await createGame(app, owner, 'multi_player');

      const joiner = await register_user(app, unique_username('leave_non_owner_joiner'));
      const { socket:ownerSocket }= await register_ready_socket_client(baseUrl, owner);
      const { socket:joinerSocket } = await register_ready_socket_client(baseUrl, joiner);

      try {
        await joinGame(joinerSocket, game_id);

        const leaveSuccess = receive_socket_as(joinerSocket, 'lobby:leave:success');
        const leaveUpdate = receive_socket_as(ownerSocket, 'lobby:leave:update');

        send_socket_as(joinerSocket, 'lobby:leave');

        await leaveSuccess;
        const update = await leaveUpdate;

        expect(update.message).toContain(joiner.username);

        const game = await app.store.get_game_store().get_game_by_id(game_id);
        expect(game).toBeDefined();
        expect(game?.get_owner_id()).toBe(owner.player_id);
        expect(game?.get_player_ids().has(owner.player_id)).toBe(true);
        expect(game?.get_player_ids().has(joiner.player_id)).toBe(false);
      } finally {
        close_socket_client(ownerSocket);
        close_socket_client(joinerSocket);
      }
    });

    it('transfers ownership when owner leaves multiplayer game', async() => {
      const owner = await register_user(app, unique_username('leave_owner_transfer_owner'));
      const game_id = await createGame(app, owner, 'multi_player');

      const  nextOwner = await register_user(app, unique_username('leave_owner_transfer_next'));
      const { socket:ownerSocket } = await register_ready_socket_client(baseUrl, owner);
      const { socket:nextOwnerSocket } = await register_ready_socket_client(baseUrl, nextOwner);

      try {
        await joinGame(nextOwnerSocket, game_id);

        const newOwner = receive_socket_as(nextOwnerSocket, 'lobby:new_owner');
        const leaveUpdate = receive_socket_as(nextOwnerSocket, 'lobby:leave:update');
        const leaveSuccess = receive_socket_as(ownerSocket, 'lobby:leave:success');

        send_socket_as(ownerSocket, 'lobby:leave');

        await newOwner;
        const update = await leaveUpdate;
        await leaveSuccess;

        expect(update.message).toContain(owner.username);

        const game = await app.store.get_game_store().get_game_by_id(game_id);
        expect(game).toBeDefined();
        expect(game?.get_owner_id()).toBe(nextOwner.player_id);
        expect(game?.get_player_ids().has(owner.player_id)).toBe(false);
        expect(game?.get_player_ids().has(nextOwner.player_id)).toBe(true);
      } finally {
        close_socket_client(ownerSocket);
        close_socket_client(nextOwnerSocket);
      }
    });
  });
});
