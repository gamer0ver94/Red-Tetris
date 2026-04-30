import {Game} from '../models/game_model.ts';

import { Board } from '../models/board_model.ts';
import { Piece } from '../models/piece_model.ts';

import { spawn_piece } from './game_core_services.js';
//Prepares game when lobby is ready


export function setup_game_boards(game:Game){

    const ids = game.get_player_ids();

    for (const id of ids){
        const res = create_board_for_player(id, game);
        if(!res.success)
            return {success:false, reason:res.reason, trigger_id:id};
        game.set_player_piece_map(id);
        const spwan_res = spawn_piece(game.get_board_map().get(id)!, new Piece(game.get_next_piece(id)));
        if(!spwan_res.success)
            return {success:false, reason:spwan_res.reason, trigger_id:id};
    }
    return {success:true};
}

export function create_board_for_player(player_id:string, game:Game){

    if(!game.get_player_ids().has(player_id))
        return {success:false, reason:'Wrong player id'};

    const board = new Board();
    const success = game.set_new_board(player_id, board);
    if(!success)
        return {success, reason:'Duplicate Board'};
    return {success};
}
