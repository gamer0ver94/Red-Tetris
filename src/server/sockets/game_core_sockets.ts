import { move_left, move_right, hold } from "../services/game_core_services.js";
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
            move_left(board_res.data);
            const input_state = sid_to_input_state.get(sid);
            input_state!.r_pressed = false;
            clearTimeout(input_state!.r_timer);
            clearInterval(input_state?.r_repeat);
            input_state!.l_timer = setTimeout(() => {
                input_state!.l_repeat = setInterval(() => {
                    move_left(board_res.data);
                },  AUTO_REPEAT_RATE);
            }, DELAY_AUTO_SHIFT);
        }
    });

    socket.on('game:right:press', async() => {
        if(!sid_to_input_state.get(sid))
            sid_to_input_state.set(sid, {l_pressed:false, r_pressed:true});
        const board_res = store.get_board_by_sid(sid);
        if(board_res.success){
            move_right(board_res.data);
            const input_state = sid_to_input_state.get(sid);
            input_state!.l_pressed = false;
            clearTimeout(input_state!.l_timer);
            clearInterval(input_state?.l_repeat);
            input_state!.r_timer = setTimeout(() => {
                input_state!.r_repeat = setInterval(() => {
                    move_right(board_res.data);
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
        const player_res = store.get_player_store().get_player_by_sid(sid);
        if(!player_res.success) return;
        const active_game_res = store.get_active_game_store()
            .get_active_game_by_player_id(player_res.data.get_player_id());
        if(active_game_res.success)
            hold(active_game_res.data, player_res.data.get_player_id());
    });

    socket.on('game:rotate', async() => {
        const player_in_game_res = store.get_player_in_game_by_sid(sid);
        if (!player_in_game_res.success)
            return;

        const board = player_in_game_res.data.get_board();
        const current_piece = board.get_current_piece();
        if (!current_piece)
            return;

        const next_rotation = current_piece.get_next_rotation();
        const kicks = [
            [0, 0],
            [-1, 0],
            [1, 0],
            [-2, 0],
            [2, 0],
            [0, -1],
        ];
        for (const [dx, dy] of kicks) {
            if (board.can_place(current_piece, dx, dy, next_rotation)) {
                current_piece.move_by(dx, dy);
                current_piece.add_rotation();
                return;
            }
        }
    })
}

