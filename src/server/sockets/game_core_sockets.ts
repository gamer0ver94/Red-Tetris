import { Piece } from "../models/piece_model.js";
import { move_piece_left, move_piece_right } from "../services/game_core_services.js";
import { Store } from "../stores/store.js";
import { TypedSocket } from "../types/socket_event_types.js";

const AUTO_REPEAT_RATE = 35;
const DELAY_AUTO_SHIFT = 120;
const sid_to_input_state = new Map<string, InputState>();

type InputState = {
    l_pressed:boolean;
    r_pressed:boolean;
    l_timer?:NodeJS.Timeout;
    r_timer?:NodeJS.Timeout;
    l_repeat?:NodeJS.Timeout;
    r_repeat?:NodeJS.Timeout;
}

export async function socket_game_core(
    socket:TypedSocket,
    sid:string,
    store:Store,
){
    socket.on('game:left:press', async() => {
        if(!sid_to_input_state.get(sid))
            sid_to_input_state.set(sid, {l_pressed:true, r_pressed:false});
        const board_res = store.get_board_by_sid(sid);
        if(board_res.success){
            move_piece_left(board_res.data);
            const input_state = sid_to_input_state.get(sid);
            input_state!.r_pressed = false;
            clearTimeout(input_state!.r_timer);
            clearInterval(input_state?.r_repeat);
            input_state!.l_timer = setTimeout(() => {
                input_state!.l_repeat = setInterval(() => {
                    move_piece_left(board_res.data);
                },  AUTO_REPEAT_RATE);
            }, DELAY_AUTO_SHIFT);
        }
    });

    socket.on('game:right:press', async() => {
        if(!sid_to_input_state.get(sid))
            sid_to_input_state.set(sid, {l_pressed:false, r_pressed:true});
        const board_res = store.get_board_by_sid(sid);
        if(board_res.success){
            move_piece_right(board_res.data);
            const input_state = sid_to_input_state.get(sid);
            input_state!.l_pressed = false;
            clearTimeout(input_state!.l_timer);
            clearInterval(input_state?.l_repeat);
            input_state!.r_timer = setTimeout(() => {
                input_state!.r_repeat = setInterval(() => {
                    move_piece_right(board_res.data);
                },AUTO_REPEAT_RATE);
            }, DELAY_AUTO_SHIFT);
        }
    });

    socket.on('game:left:release', async() => {
        const input_state = sid_to_input_state.get(sid);
        if(input_state){
            input_state!.l_pressed = false;
            clearTimeout(input_state!.l_timer);
            clearInterval(input_state?.l_repeat);
        }
    });

    socket.on('game:right:release', async() => {
        const input_state = sid_to_input_state.get(sid);
        if(input_state){
            input_state!.r_pressed = false;
            clearTimeout(input_state!.r_timer);
            clearInterval(input_state?.r_repeat);
        }
    });

    socket.on('game:soft:press', async() => {
        const player_in_game_res = store.get_player_in_game_by_sid(sid);
        if(player_in_game_res.success){
            const gravity = player_in_game_res.data.get_gravity();
            gravity.soft_drop = true;
            gravity.hard_drop = false;
        }
    });

    socket.on('game:hard:press', async() => {
        const player_in_game_res = store.get_player_in_game_by_sid(sid);
        if(player_in_game_res.success){
            const gravity = player_in_game_res.data.get_gravity();
            gravity.soft_drop = false;
            gravity.hard_drop = true;
        }
    });

    socket.on('game:soft:release', async() => {
        const player_in_game_res = store.get_player_in_game_by_sid(sid);
        if(player_in_game_res.success){
            const gravity = player_in_game_res.data.get_gravity();
            gravity.soft_drop = false;
            
        }
    });

    socket.on('game:hard:release', async() => {
        const player_in_game_res = store.get_player_in_game_by_sid(sid);
        if(player_in_game_res.success){
            const gravity = player_in_game_res.data.get_gravity();
            gravity.hard_drop = false;
            
        }
    });

    socket.on('game:hold', async() => {
        //Board + Player in game
        const player_res = store.get_player_store().get_player_by_sid(sid);
        if(!player_res.success)
            return;
        const player = player_res.data;

        const active_game_res = store.get_active_game_store().get_active_game_by_player_id(player.get_player_id());
        if(!active_game_res.success)
            return;
        const active_game = active_game_res.data;

        if(!active_game.get_game_opts().pieces.allowHold)
            return;
        const player_in_game_res = active_game.get_player(player.get_player_id());
        if(!player_in_game_res.success)
            return;
        const player_in_game = player_in_game_res.data;

        if(player_in_game.get_hold())
            return;

        const board = player_in_game.get_board();
        const current_piece = board.get_current_piece();
        const has_hold_piece = player_in_game.get_hold_piece() !== null;

        const new_curr = player_in_game.shift_hold_piece(current_piece!.get_type());
            
        if(!has_hold_piece){
            const next_piece_res = active_game.get_next_piece_for_player(player.get_player_id());
            if(!next_piece_res.success)
                return;
            board.set_current_piece(new Piece(next_piece_res.data));
            return;
        }
        board.set_current_piece(new Piece(new_curr));
    });

    socket.on('game:rotate', async() => {
        const player_in_game_res = store.get_player_in_game_by_sid(sid);
        if(!player_in_game_res.success)
            return;
        const player_in_game = player_in_game_res.data;
        const board = player_in_game.get_board();
        const current_piece = board.get_current_piece();
        if(current_piece){
            const next_rotation = current_piece.get_next_rotation();
            if(board.can_place(current_piece, 0, 0, next_rotation))
                current_piece.add_rotation();
            else if(board.can_place(current_piece, -1, 0, next_rotation)){
                current_piece.move_by(-1,0);
                current_piece.add_rotation();
            }
            else if (board.can_place(current_piece, 1, 0, next_rotation)){
                current_piece.move_by(1,0);
                current_piece.add_rotation();
            }
            else if(board.can_place(current_piece, 0, 1, next_rotation)){
                current_piece.move_by(0,1);
                current_piece.add_rotation();
            }
        }
    })
}