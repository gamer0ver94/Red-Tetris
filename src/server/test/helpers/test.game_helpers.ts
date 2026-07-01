import { GameOptions } from "../../types/game_options_types.js";
import type { BoardType } from '../../types/game_types.js';

import * as test_types from "../test.types.js";
import * as test_sockets from "./test.socket_helpers.js";
import * as test_auth from "./test.auth_helpers.js";


import type { FastifyInstance } from 'fastify';
import { expect } from 'vitest';


//THIS ASSUME NO CodeType error is returned
export async function create_game_for_user(
    app:FastifyInstance,
    user: test_types.TestAuthUser,
    mode:string = 'classic',
    options?:GameOptions,
):Promise<string>{

    const res = await test_auth.inject_as(app,user, {
        method:'POST',
        url: '/game/create',
        payload:{ game_mode:mode, ...(options ? {options} : {})},
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.game_id).toBeDefined();

    return body.game_id as string;
}


export async function join_game_for_user(
    socket:test_types.TestSocketClient,
    game_id:string,
): Promise<void> {
    const joined = test_sockets.receive_socket_as(socket, 'lobby:join:success');
    test_sockets.send_socket_as(socket, 'lobby:join', { game_id });
    await joined;
}

export async function set_ready_for_user(
    socket:test_types.TestSocketClient
):Promise<void>{
    const ready = test_sockets.receive_socket_as(socket, 'lobby:ready:success');
    test_sockets.send_socket_as(socket, 'lobby:ready');
    await ready
}

export async function set_start_for_user(
    host_socket:test_types.TestSocketClient,
    remaining_sockets:test_types.TestSocketClient[] = [host_socket],
){
    const started = remaining_sockets.map((socket) =>
        test_sockets.receive_socket_as(socket, 'lobby:start:success')
    );

    test_sockets.send_socket_as(host_socket, 'lobby:start');
    await Promise.all(started);
}

export async function set_leave_game_for_user(
    socket:test_types.TestSocketClient
):Promise<void>
{
    const left = test_sockets.receive_socket_as(socket, 'lobby:leave:success');
    test_sockets.send_socket_as(socket, 'lobby:leave');
    await left
}

export function move_for_user(
    socket:test_types.TestSocketClient,
    key:test_types.MoveKey,
    type?:'press'|'release',
):void{
    if(type)
        test_sockets.send_socket_as(socket, `game:${key}:${type}` as any);
    else
        test_sockets.send_socket_as(socket, `game:${key}` as any);
}

export function mutate_player_in_game(
    app: FastifyInstance,
    user: test_types.TestAuthUser,
    patch: { score?: number; lines?: number; lost?: boolean },
): void {
    const active_res = app.store
        .get_active_game_store()
        .get_active_game_by_player_id(user.player_id);

    expect(active_res.success).toBe(true);
    if (!active_res.success) throw new Error('Expected active game');

    const player_res = active_res.data.get_player(user.player_id);
    expect(player_res.success).toBe(true);
    if (!player_res.success) throw new Error('Expected player in active game');

    if (patch.score !== undefined) player_res.data.set_score(patch.score);
    if (patch.lines !== undefined) player_res.data.add_lines(patch.lines);
    if (patch.lost) player_res.data.mark_lost();
}

export function mutate_board_for_user(
    app: FastifyInstance,
    user: test_types.TestAuthUser,
    next_board: BoardType,
): BoardType {
    const active_res = app.store
        .get_active_game_store()
        .get_active_game_by_player_id(user.player_id);

    expect(active_res.success).toBe(true);
    if (!active_res.success) throw new Error('Expected active game');

    const player_res = active_res.data.get_player(user.player_id);
    expect(player_res.success).toBe(true);
    if (!player_res.success) throw new Error('Expected player in active game');

    assert_valid_board(next_board);

    const board = player_res.data.get_board();
    const grid = board.get_board();

    grid.splice(
        0,
        grid.length,
        ...next_board.map((row) => [...row]),
    );

    return grid;
}

export async function create_and_start_game(
    app:FastifyInstance,
    host:test_types.TestAuthUser,
    host_socket:test_types.TestSocketClient,
    mode:string = 'classic',
    opponents:test_types.TestSocketClient[],
    options?:GameOptions
):Promise<string>{

    const game_id = await create_game_for_user(app, host, mode, options);

    for(const socket of opponents){
        await join_game_for_user(socket, game_id);
        await set_ready_for_user(socket);
    }
    await set_ready_for_user(host_socket);
    await set_start_for_user(host_socket, [host_socket, ...opponents]);
    
    return game_id;
}

export async function register_player(
    prefix: string,
    app:FastifyInstance,
    baseUrl:string,
): Promise<{ user: test_types.TestAuthUser; socket: test_types.TestSocketClient }> {
    const user = await test_auth.register_user(app, test_auth.unique_username(prefix));
    const { socket } = await test_sockets.register_ready_socket_client(baseUrl, user);
    return { user, socket };
}
function assert_valid_board(board: BoardType): void {
    expect(board.length).toBeGreaterThan(0);

    const width = board[0]?.length;
    expect(width).toBeGreaterThan(0);

    for (const row of board) {
        expect(row.length).toBe(width);

        for (const cell of row) {
            expect(test_types.VALID_BOARD_CELLS.has(cell)).toBe(true);
        }
    }
}
