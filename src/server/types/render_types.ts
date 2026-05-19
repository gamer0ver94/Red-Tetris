import { BoardType } from './game_types.ts';

export type RenderPayload = {
  self:{
    current_pos:null| [number|null, number|null, number|null]; //x , y and rotation
    current_piece_type:null | string;
    current_piece_shape: BoardType | null;
    board:BoardType;
    hold_piece_type:null|string;
    next_piece_types:string[]|null;
  }
  opponents:Record<string, OpponentRender>;
}


export type OpponentRender = 
| {view:'full'; board:BoardType}
| {view:'grid'; board:BoardType}
| {view:'highest'; highest:number};