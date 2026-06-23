import { BoardType } from './game_types.ts';

export type RenderPayload = {
  self:{
    board:BoardType;
    hold_piece_type:null|string;
    next_piece_types:string[]|null;
    score:number|null;
  }
  opponents:Record<string, OpponentRender>;
}


export type OpponentRender = 
| {view:'full'; board:BoardType}
| {view:'grid'; board:BoardType}
| {view:'highest'; board:BoardType};

export type ClearPhaseMode = "regular" | "cell_gravity";

export type ClearPhaseState = {
  mode: ClearPhaseMode;
  frames: BoardType[];
  frame_index: number;
  next_frame_at: number;
  final_board: BoardType;
  cleared_lines: number;
  cleared_garbage: number;
}
