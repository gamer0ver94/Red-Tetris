import { ActiveGame } from "../models/active_game_model.js";
import { move_left, move_right, hold, rotate } from "../services/game_core_services.js";
import { Store } from "../stores/store.js";
import { ModelResult, CodeType } from "../types/error_code_types.js";
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

        const test = sid_to_input_state.get(sid);
        if(!test){
            sid_to_input_state.set(sid, {l_pressed:false, r_pressed:false});
        }
        const ctx = resolve_context(sid, store);
        if(!ctx.success) return;
        
        move_left(ctx.data.active_game, ctx.data.player_id);
        const input_state = sid_to_input_state.get(sid);
        input_state!.r_pressed = false;
        clearTimeout(input_state!.r_timer);
        clearInterval(input_state?.r_repeat);
        input_state!.l_timer = setTimeout(() => {
            input_state!.l_repeat = setInterval(() => {
                move_left(ctx.data.active_game, ctx.data.player_id);
            }, AUTO_REPEAT_RATE);
        }, DELAY_AUTO_SHIFT);
    });

    socket.on('game:right:press', async() => {
        
        const test = sid_to_input_state.get(sid);
        if(!test){
            sid_to_input_state.set(sid, {l_pressed:false, r_pressed:false});
        }

        const ctx = resolve_context(sid, store);
        if(!ctx.success) return;

        move_right(ctx.data.active_game, ctx.data.player_id);
        const input_state = sid_to_input_state.get(sid);
        input_state!.l_pressed = false;
        clearTimeout(input_state!.l_timer);
        clearInterval(input_state?.l_repeat);
        input_state!.r_timer = setTimeout(() => {
            input_state!.r_repeat = setInterval(() => {
                move_right(ctx.data.active_game, ctx.data.player_id);
            },AUTO_REPEAT_RATE);
        }, DELAY_AUTO_SHIFT);
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
        
        const ctx = resolve_context(sid, store);
        if(ctx.success)
            hold(ctx.data.active_game, ctx.data.player_id);
    });

    socket.on('game:rotate', async() => {
        const ctx = resolve_context(sid, store);
        if(ctx.success)
            rotate(ctx.data.active_game, ctx.data.player_id);
    })
}

function resolve_context(sid:string, store:Store)
: ModelResult<{active_game:ActiveGame, player_id:string}, CodeType>{
    
    const player_res = store.get_player_store().get_player_by_sid(sid);
    if(!player_res.success)
        return {success:false, code:'PLAYER_NOT_FOUND'};

    const active_game_res = store.get_active_game_store()
        .get_active_game_by_player_id(player_res.data.get_player_id());
    if(!active_game_res.success)
        return {success:false, code:'ACTIVE_GAME_NOT_FOUND'};

    return {success:true, data:{active_game:active_game_res.data, player_id:player_res.data.get_player_id()}};
}

