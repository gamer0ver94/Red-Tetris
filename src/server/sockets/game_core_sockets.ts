import { move_piece_left, move_piece_right } from "../services/game_core_services.js";
import { Store } from "../stores/store.js";
import { TypedIoServer, TypedSocket } from "../types/socket_event_types.js";


export async function socket_game_core(
    socket:TypedSocket,
    sid:string,
    store:Store,
){
    socket.on('game:move:left:press', async() => {
        const board_res = store.get_board_by_sid(sid);
        if(board_res.success)
            move_piece_left(board_res.data);
    });

    socket.on('game:move:right:press', async() => {
        const board_res = store.get_board_by_sid(sid);
        if(board_res.success)
            move_piece_right(board_res.data);
    });
}