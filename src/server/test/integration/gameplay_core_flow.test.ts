import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { Piece } from '../../models/piece_model.js';
import { tick_board } from '../../services/game_core_services.js';
import { stop_game_loop } from '../../services/game_loop_services.js';
import * as test_sockets from '../helpers/socket_helpers.test.js';
import * as test_game from '../helpers/game_helpers.test.js';
import * as test_types from '../types.test.js';
import type { BoardCell, BoardType } from '../../types/game_types.js';
import type { ActiveGame } from '../../models/active_game_model.js';
import type { PlayerInGame } from '../../models/player_in_game_model.js';

describe('game core flow', () => {
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
    it('game start with current piece', async() => {
        const {user:host, socket:host_socket} = await test_game.register_player('solo', app, baseUrl);

        try{
            const game_id = await test_game.create_and_start_game(app, host, host_socket, 'classic', []);
            const render = await test_sockets.receive_socket_as(host_socket, 'game:render');

            expect_non_empty_board(render.self.board, game_id, host, app);
            expect_same_board(render.self.board, game_id, host, app);
        }
        finally{
            test_sockets.close_socket_client(host_socket);
        }
    });

    //u1 move left
    it('move left affect render', async() => {
        await expect_move_rendered_by('left', -1, app, baseUrl);
    });

    // u1 move right
    it('move right affect render', async() => {
        await expect_move_rendered_by('right', 1, app, baseUrl);
    });

    //u1 soft drop
    it('soft drop increase speed', async() => {
        const {user:host, socket:host_socket} = await test_game.register_player('solo', app, baseUrl);

        try{
            const game_id = await test_game.create_and_start_game(app, host, host_socket, 'classic', []);
            const player = get_active_player(app, game_id, host);

            test_sockets.send_socket_as(host_socket, 'game:soft:press');
            await wait_until(() => player.get_gravity().soft_drop);
            expect(player.get_gravity().soft_drop).toBe(true);
            expect(player.get_gravity().hard_drop).toBe(false);

            test_sockets.send_socket_as(host_socket, 'game:soft:release');
            await wait_until(() => !player.get_gravity().soft_drop);
            expect(player.get_gravity().soft_drop).toBe(false);
        } finally {
            test_sockets.close_socket_client(host_socket);
        }
    });

    //u1 hard drop
    it('lock piece on hard drop', async() => {
        const {user:host, socket:host_socket} = await test_game.register_player('solo', app, baseUrl);

        try{
            const game_id = await test_game.create_and_start_game(app, host, host_socket, 'classic', []);
            const player = get_active_player(app, game_id, host);
            await test_sockets.receive_socket_as(host_socket, 'game:render');

            const locks_before = player.get_total_lock();
            const settled_before = count_cells(player.get_board().get_board(), (cell) => cell !== '.');

            test_sockets.send_socket_as(host_socket, 'game:hard:press');
            await wait_until(() => player.get_total_lock() > locks_before);
            const render = await test_sockets.receive_socket_as(host_socket, 'game:render');

            expect_same_board(render.self.board, game_id, host, app);
            expect(player.get_total_lock()).toBeGreaterThan(locks_before);
            expect(count_cells(player.get_board().get_board(), (cell) => cell !== '.')).toBeGreaterThan(settled_before);
        } finally {
            test_sockets.close_socket_client(host_socket);
        }
    });

    //simulate fake board and fake lines for u1 ? 
    it('line clear update board/lines/score', async() => {
        const {user:host, socket:host_socket} = await test_game.register_player('solo', app, baseUrl);

        try{
            const game_id = await test_game.create_and_start_game(app, host, host_socket, 'classic', []);
            stop_game_loop(game_id);
            const active_game = get_active_game(app, game_id);
            const player = get_active_player(app, game_id, host);

            prepare_single_line_clear(player);

            const tick_res = tick_board(
                player.get_board(),
                host.player_id,
                active_game,
                Date.now(),
                true,
                true,
            );

            expect(tick_res.success).toBe(true);
            expect(player.get_lines()).toBe(1);
            expect(player.get_score()).toBe(100);
            expect(row_is_empty(player.get_board().get_board()[0])).toBe(true);
        } finally {
            test_sockets.close_socket_client(host_socket);
        }
    });

    it('send unclearable garbage to opponents', async() => {
        const {user:host, socket:host_socket} = await test_game.register_player('garbage_host', app, baseUrl);
        const {user:opponent, socket:opponent_socket} = await test_game.register_player('garbage_opponent', app, baseUrl);

        try{
            const game_id = await test_game.create_and_start_game(
                app,
                host,
                host_socket,
                'classic',
                [opponent_socket],
            );
            stop_game_loop(game_id);
            const active_game = get_active_game(app, game_id);
            const host_player = get_active_player(app, game_id, host);
            const opponent_player = get_active_player(app, game_id, opponent);
            const opponent_before = clone_board(opponent_player.get_board().get_board());

            prepare_double_line_clear(host_player);

            const tick_res = tick_board(
                host_player.get_board(),
                host.player_id,
                active_game,
                Date.now(),
                true,
                true,
            );

            expect(tick_res.success).toBe(true);
            expect(host_player.get_lines()).toBe(2);
            expect_new_garbage_on_board(opponent_before, opponent_player.get_board().get_board());
            expect(opponent_player.get_score()).toBe(-50);
        } finally {
            test_sockets.close_socket_client(host_socket);
            test_sockets.close_socket_client(opponent_socket);
        }
    });
});

async function expect_move_rendered_by(
    direction:'left'|'right',
    expected_x_delta:number,
    app:FastifyInstance,
    baseUrl:string,
): Promise<void> {
    const {user:host, socket:host_socket} = await test_game.register_player('solo', app, baseUrl);

    try{
        const game_id = await test_game.create_and_start_game(app, host, host_socket, 'classic', []);
        const render = await test_sockets.receive_socket_as(host_socket, 'game:render');
        expect_same_board(render.self.board, game_id, host, app);

        test_sockets.send_socket_as(host_socket, `game:${direction}:press`);
        test_sockets.send_socket_as(host_socket, `game:${direction}:release`);

        const moved_render = await test_sockets.receive_socket_as(host_socket, 'game:render');
        const diff = expect_diff_board(render.self.board, moved_render.self.board);

        expect(diff.length).toBeGreaterThan(0);
        expect_same_board(moved_render.self.board, game_id, host, app);
        expect_board_moved_by(render.self.board, moved_render.self.board, {
            x: expected_x_delta,
        });
    } finally {
        test_sockets.close_socket_client(host_socket);
    }
}

function expect_non_empty_board(
    board:BoardType,
    game_id:string,
    user:test_types.TestAuthUser,
    app:FastifyInstance
): void {
    const player = get_active_player(app, game_id, user);
    const current_piece = player.get_board().get_current_piece();

    expect(current_piece).not.toBeNull();
    expect(count_cells(board, (cell) => cell !== '.')).toBeGreaterThan(0);
}

function get_active_game(app:FastifyInstance, game_id:string): ActiveGame {
    const active_res = app
        .store
        .get_active_game_store()
        .get_active_game_by_lobby_id(game_id);

    expect(active_res.success).toBe(true);
    if(!active_res.success)
        throw new Error('No active game found');

    return active_res.data;
}

function expect_same_board(
    user_board:BoardType,
    game_id:string,
    user:test_types.TestAuthUser,
    app:FastifyInstance,
): void {
    const player = get_active_player(app, game_id, user);
    const expected = build_visible_board(player);

    expect(user_board).toEqual(expected);
}


function expect_diff_board(
    old_board:BoardType,
    new_board:BoardType,
): BoardDiff[] {
    assert_same_board_size(old_board, new_board);
    const diff = get_board_diff(old_board, new_board);

    expect(diff.length).toBeGreaterThan(0);
    return diff;
}

function expect_new_garbage_on_board(
    old_board:BoardType,
    new_board:BoardType,
): BoardDiff[] {
    const diff = expect_diff_board(old_board, new_board);
    expect(diff.some((cell) => cell.after === 'X' && cell.before !== 'X')).toBe(true);
    return diff;
}

type BoardDiff = {
    x:number;
    y:number;
    before:BoardCell;
    after:BoardCell;
};

function get_active_player(
    app:FastifyInstance,
    game_id:string,
    user:test_types.TestAuthUser,
): PlayerInGame {
    const active_game = get_active_game(app, game_id);

    const player_res = active_game.get_player(user.player_id);
    expect(player_res.success).toBe(true);
    if(!player_res.success)
        throw new Error('No active player found');

    return player_res.data;
}

function prepare_single_line_clear(player:PlayerInGame): void {
    const board = player.get_board();
    const grid = board.get_board();
    const y = grid.length - 1;

    fill_row_except(grid, y, [3, 4, 5, 6], 'T');
    board.set_current_piece(new Piece('I', 3, y - 1));
}

function prepare_double_line_clear(player:PlayerInGame): void {
    const board = player.get_board();
    const grid = board.get_board();
    const bottom = grid.length - 1;
    const above = bottom - 1;

    fill_row_except(grid, above, [4, 5], 'T');
    fill_row_except(grid, bottom, [4, 5], 'T');
    board.set_current_piece(new Piece('O', 3, above));
}

function fill_row_except(
    grid:BoardType,
    y:number,
    holes:number[],
    cell:BoardCell,
): void {
    const hole_set = new Set(holes);

    for(let x = 0; x < grid[y].length; x++)
        grid[y][x] = hole_set.has(x) ? '.' : cell;
}

function row_is_empty(row:BoardCell[]): boolean {
    return row.every((cell) => cell === '.');
}

async function wait_until(
    predicate:() => boolean,
    timeout_ms = 1500,
): Promise<void> {
    const started_at = Date.now();

    while(Date.now() - started_at < timeout_ms){
        if(predicate())
            return;
        await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error('Timed out waiting for condition');
}

function build_visible_board(player:PlayerInGame): BoardType {
    const board = player.get_board();
    const visible = clone_board(board.get_board());
    const current_piece = board.get_current_piece();

    if(!current_piece)
        return visible;

    for(const cell of current_piece.get_cells()){
        if(cell.y < 0 || cell.y >= visible.length)
            continue;
        if(cell.x < 0 || cell.x >= visible[0].length)
            continue;
        visible[cell.y][cell.x] = cell.type;
    }

    return visible;
}

function clone_board(board:BoardType): BoardType {
    return board.map((row) => [...row]);
}

function count_cells(
    board:BoardType,
    predicate:(cell:BoardCell) => boolean,
): number {
    return board.reduce(
        (total, row) => total + row.filter(predicate).length,
        0,
    );
}

function get_board_diff(
    old_board:BoardType,
    new_board:BoardType,
): BoardDiff[] {
    assert_same_board_size(old_board, new_board);

    const diff: BoardDiff[] = [];

    for(let y = 0; y < old_board.length; y++){
        for(let x = 0; x < old_board[y].length; x++){
            if(old_board[y][x] === new_board[y][x])
                continue;

            diff.push({
                x,
                y,
                before: old_board[y][x],
                after: new_board[y][x],
            });
        }
    }

    return diff;
}

function assert_same_board_size(
    old_board:BoardType,
    new_board:BoardType,
): void {
    expect(new_board.length).toBe(old_board.length);

    for(let y = 0; y < old_board.length; y++)
        expect(new_board[y]?.length).toBe(old_board[y].length);
}

type BoardMoveDelta = {
    x?:number;
    y?:number;
};

function expect_board_moved_by(
    old_board:BoardType,
    new_board:BoardType,
    delta:BoardMoveDelta,
): void {
    const old_box = get_occupied_box(old_board);
    const new_box = get_occupied_box(new_board);

    expect(new_box.count).toBe(old_box.count);

    if(delta.x !== undefined){
        expect(new_box.min_x - old_box.min_x).toBe(delta.x);
        expect(new_box.max_x - old_box.max_x).toBe(delta.x);
    }

    if(delta.y !== undefined){
        expect(new_box.min_y - old_box.min_y).toBe(delta.y);
        expect(new_box.max_y - old_box.max_y).toBe(delta.y);
    }
}

type OccupiedBox = {
    min_x:number;
    max_x:number;
    min_y:number;
    max_y:number;
    count:number;
};

function get_occupied_box(board:BoardType): OccupiedBox {
    const cells: {x:number; y:number}[] = [];

    for(let y = 0; y < board.length; y++){
        for(let x = 0; x < board[y].length; x++){
            if(board[y][x] !== '.')
                cells.push({x, y});
        }
    }

    expect(cells.length).toBeGreaterThan(0);

    return {
        min_x: Math.min(...cells.map((cell) => cell.x)),
        max_x: Math.max(...cells.map((cell) => cell.x)),
        min_y: Math.min(...cells.map((cell) => cell.y)),
        max_y: Math.max(...cells.map((cell) => cell.y)),
        count: cells.length,
    };
}
