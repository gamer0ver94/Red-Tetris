//Maps backend state into frontend state
import { Store } from "../stores/store.ts";
import { Game } from "../models/game_model.ts"
import { Board } from "../models/board_model.ts";
import { BoardType } from "../types/game_types.ts";
import type { RenderPayload } from '../types/socket_event_types.ts';

export async function build_render_payload(game:Game, player_id:string, store:Store): RenderPayload{
    
    const self_board = game.get_board_map().get(player_id);

    if(!self_board)
        throw new Error('Board not found');
    
    const current_piece = self_board.get_current_piece();

    return {
        self:{
            current_pos:[
                current_piece?.get_x() ?? null,
                current_piece?.get_y() ?? null,
                current_piece?.get_rotation() ?? null],
            current_piece_type: current_piece?.get_type() ?? null,
            board:build_visible_board(self_board)
        },
        opponents: await build_opponent_payload(game, player_id, store)
    }
}

export async function build_opponent_payload(
    game: Game,
    player_id: string,
    store: Store,
): Promise<Record<string, BoardType>> {
    const opponents: Record<string, BoardType> = {};

    for (const [op_id, op_board] of game.get_board_map()) {
        if (op_id === player_id)
            continue;

        const opponent = await store.get_player_store().get_player_by_id(op_id);

        if (!opponent)
            continue;

        opponents[opponent.get_username()] = build_visible_board(op_board);
    }

    return opponents;
}

export function build_visible_board(board:Board):BoardType{

    const visible = board.get_board().map((row) => [...row]);
    const current_piece = board.get_current_piece();


    if (!current_piece)
        return visible;

    for (const cell of current_piece.get_cells()) {
        if (
            cell.y >= 0 &&
            cell.y < visible.length &&
            cell.x >= 0 &&
            cell.x < visible[0].length
        ) {
            visible[cell.y][cell.x] = cell.type;
        }
    }

    return visible;
}