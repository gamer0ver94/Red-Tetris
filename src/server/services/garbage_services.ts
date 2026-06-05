import { BoardCell, BoardType } from "../types/game_types.ts";

export function spawn_garbage(opppents_boards:Record<string,BoardType>, rows:number, can_clear:boolean){

    const received : Record<string,number> = {};
    if(rows <= 0)
        return received;

    for (const [player_id, board] of Object.entries(opppents_boards)) {
        
        if(board.length == 0 || board[0].length == 0){
            received[player_id] = 0;
            continue;
        }

        const width = board[0].length;
        let hole_pos = -1;
        if (can_clear) {
            hole_pos = Math.floor(Math.random() * width);
        }
        for (let i = 0; i < rows; i++) {
            
            const garbage_row = Array.from({length: width} , (_, x) => 
                hole_pos != -1 && x == hole_pos ? '.' : 'X'
            ) as BoardCell[];
            board.shift();
            board.push(garbage_row);
        }
        received[player_id] = rows;
    }
    return received;
}


export function resolve_garbage_to_send(clear:number, ratio:number):number{

    if(clear <= 0 )
        return 0;

    return Math.max(0, Math.floor(clear - ratio));
}

export function resolve_garbage_send_back(cleared_garbage: number, clear_create_garbage: boolean,): number {
   
    if (!clear_create_garbage || cleared_garbage <= 0)
        return 0;
   
    return cleared_garbage;
}