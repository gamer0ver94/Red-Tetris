import { BoardType } from './game_types.ts';

export type RenderPayload = {
  self:{
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