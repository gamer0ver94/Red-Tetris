import { Board } from '../models/board_model.ts';
import { Piece } from '../models/piece_model.ts';

import { spawn_piece } from './game_core_services.js';
import { Lobby } from '../models/lobby_model.js';
import { ActiveGame } from '../models/active_game_model.js';
import { Store } from '../stores/store.js';
import { GameOptions } from '../types/game_options_types.ts';
import { PlayerInGame } from '../models/player_in_game_model.js';
import { CodeType, ModelResult, StartGameData } from '../types/error_code_types.js';
import { ConfigProvider } from '../models/config_provider_model.js';
//Prepares game when lobby is ready


//No Model result here , only to add one field
export function setup_active_game(lobby:Lobby, store:Store):ModelResult<null, CodeType>{

    const ids = lobby.get_player_ids();
    const opts = lobby.get_game_opts();
    const active_game = new ActiveGame(lobby.get_lobby_id(), opts, ids);
    const add_game_res = store.get_active_game_store().add_active_game(active_game);
    if (!add_game_res.success)
            return {success:false, code:add_game_res.code};

    for (const id of ids){
        const board_res = create_board_for_player(id, lobby, active_game.get_config(), store);
        if(!board_res.success)
            return {success:false, code:board_res.code, details:{trigger_id:id}};
        const piece_res = create_piece_for_player(active_game, board_res.data!, id);
        if (!piece_res.success)
            return {success:false, code:piece_res.code, details:{trigger_id:id}};
    }
    return {success:true, data:null};
}

function create_board_for_player(player_id:string, lobby:Lobby, config:ConfigProvider, store:Store):ModelResult<Board,CodeType>{

    if(!lobby.get_player_ids().includes(player_id))
        return {success:false, code:'PLAYER_NOT_FOUND'};
    const {width, height} = config.get_boundaries();
    const board = new Board(width, height);
    const player_in_game = new PlayerInGame(board, player_id)
    const add_player_res = store.get_active_game_store().add_player_to_active_game(
        player_id,
        player_in_game,
        lobby.get_lobby_id(),
    );
    if(!add_player_res.success)
        return {success:false, code:add_player_res.code};
    return {success:true, data:board};
}

function create_piece_for_player(active_game:ActiveGame, board:Board, player_id:string):ModelResult<null, CodeType>{

    const piece_res = active_game.get_next_piece_for_player(player_id);
    if(!piece_res.success)
        return piece_res;

    const spwan_res = spawn_piece(board, new Piece(piece_res.data));
    if(!spwan_res.success)
        return spwan_res;

    return {success:true, data:null};
}
