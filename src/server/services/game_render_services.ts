//Maps backend state into frontend state
import { Store } from "../stores/store.js";

import { Board } from "../models/board_model.js";
import { BoardType } from "../types/game_types.js";
import type { OpponentRender, RenderPayload } from '../types/render_types.js';
import { ActiveGame } from "../models/active_game_model.js";
import { CodeType, ModelResult } from "../types/error_code_types.js";

export function build_render_payload(active_game:ActiveGame, player_id:string, store:Store):ModelResult<RenderPayload, CodeType>{
    
    const self_res = active_game.get_player(player_id);
    if (!self_res.success)
        return self_res;

    const self_board = self_res.data.get_board()

    if(!self_board)
        return {success:false, code:'BOARD_NOT_FOUND'};
    
    const current_piece = self_board.get_current_piece();

    const next_pieces_res = active_game.peek_pieces_for_player(player_id);
    let next_piece_types = null
    if(next_pieces_res.success)
       next_piece_types = next_pieces_res.data 

    return {success:true, data:{
            self:{
                current_pos:[
                    current_piece?.get_x() ?? null,
                    current_piece?.get_y() ?? null,
                    current_piece?.get_rotation() ?? null],
                current_piece_type: current_piece?.get_type() ?? null,
                board:build_visible_board(self_board, true),
                hold_piece_type:null,
                next_piece_types,
            },
            opponents:  build_opponent_payload(active_game, player_id, store),
        },
    };
}

function build_opponent_view(board:Board, mode:'full'|'grid'|'highest'|'none'):OpponentRender|null{


    if(mode === 'highest')
        return{
            view:'highest',
            highest:get_highest_occupied_row(board)
        };
    if(mode === 'grid')
        return {
            view:'grid',
            board:build_visible_board(board, false)
        };
    if(mode === 'full')
        return{
            view:'full',
            board:build_visible_board(board, true)
        };
    return null
}

function get_highest_occupied_row(board:Board):number{
    const grid = board.get_board();

    for(let y = 0; y < grid.length; y++){
        if(grid[y].some((cell) => cell !== '.'))
            return y;
    }
    return 0;
}

function build_opponent_payload(
    active_game: ActiveGame,
    player_id: string,
    store: Store,
): Record<string, OpponentRender> {

    const mode = active_game.get_game_opts().multiplayer.seeOpponents;

    const opponent_render: Record<string, OpponentRender> = {};

    for (const opponent of active_game.get_opponents_of(player_id)) {
        let username:string;
        const user_res = store.get_player_store().get_player_by_id(opponent.get_player_id());
        if(!user_res.success)
            username = 'Username Not Found';
        else
            username = user_res.data.get_username();

        const render = build_opponent_view(opponent.get_board(), mode)
        if(render !== null)
            opponent_render[username] = render;
    }

    return opponent_render;
}

function build_visible_board(board:Board, cur_piece_visible:boolean):BoardType{

    const visible = board.get_board().map((row) => [...row]);
    const current_piece = board.get_current_piece();


    if (!current_piece || !cur_piece_visible)
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