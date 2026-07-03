//Maps backend state into frontend state
import { Store } from "../stores/store.js";

import type { OpponentRender, RenderPayload } from '../types/render_types.js';
import { ActiveGame } from "../models/active_game_model.js";
import { CodeType, ModelResult } from "../types/error_code_types.js";
import { get_current_phase_frame } from "../core/clear_frames.js";
import { PlayerInGame } from "../models/player_in_game_model.js";
import {
    build_empty_board,
    build_highest_board,
    build_visible_board,
} from "../core/render.js";

export function build_render_payload(active_game:ActiveGame, player_id:string, store:Store):ModelResult<RenderPayload, CodeType>{
    
    const self_res = active_game.get_player(player_id);
    if (!self_res.success)
        return self_res;

    const self_board = self_res.data.get_board()
    if(!self_board)
        return {success:false, code:'BOARD_NOT_FOUND'};

    const next_pieces_res = active_game.peek_pieces_for_player(player_id);
    let next_piece_types = null
    if(next_pieces_res.success)
       next_piece_types = next_pieces_res.data


    const show_grid = !active_game.get_config().is_invisible() || self_res.data.is_grid_visible();
    const phase = self_res.data.get_clear_phase();
    const current_piece = self_board.get_current_piece()?.to_state() ?? null;
    const show_lock_highlight = active_game.get_config().is_lock_highlight_enabled();

    const render_board = phase
        ? get_current_phase_frame(phase)
        : show_grid
            ? build_visible_board(current_piece, self_board.get_board(), true, show_lock_highlight)
            : build_empty_board(current_piece, self_board.get_board(), true, show_lock_highlight);
    
    const score = active_game.get_config().is_score_enable() ? self_res.data.get_score() : null;

    return {success:true, data:{
            self:{
                board:render_board,
                next_piece_types,
                score,
                ...(active_game.get_config().can_hold()
                ? {hold_piece_type: self_res.data.get_hold_piece()}
                : {}),
            },
            opponents:  build_opponent_payload(active_game, player_id, store),
        },
    };
}

function build_opponent_view(
    opponent:PlayerInGame,
    mode:'full'|'grid'|'highest'|'none'):OpponentRender|null{

    let board = opponent.get_board().get_board();
    const phase = opponent.get_clear_phase();
    const current_piece = phase
        ? null
        : opponent.get_board().get_current_piece()?.to_state() ?? null;
    if (phase)
        board = get_current_phase_frame(phase);
    if(mode === 'highest')
        return{
            view:'highest',
            board:build_highest_board(current_piece, board, false, false),
        };
    if(mode === 'grid')
        return {
            view:'grid',
            board:build_visible_board(current_piece, board, false, false),
        };
    if(mode === 'full')
        return{
            view:'full',
            board:build_visible_board(current_piece, board, true, false)
        };
    return null
}


function build_opponent_payload(
    active_game: ActiveGame,
    player_id: string,
    store: Store,
): Record<string, OpponentRender> {

    const mode = active_game.get_config().get_oppenent_grid_mode();

    const opponent_render: Record<string, OpponentRender> = {};

    for (const opponent of active_game.get_opponents_of(player_id)) {
        let username:string;
        const user_res = store.get_player_store().get_player_by_id(opponent.get_player_id());
        if(!user_res.success)
            username = 'Username Not Found';
        else
            username = user_res.data.get_username();

        const render = build_opponent_view(opponent, mode)
        if(render !== null)
            opponent_render[username] = render;
    }

    return opponent_render;
}
