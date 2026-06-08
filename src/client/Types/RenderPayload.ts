export type BoardCell = '.' | 'X' | string;

export type BoardType = BoardCell[][];

export type OpponentRender =
  | { view: 'full'; board: BoardType }
  | { view: 'grid'; board: BoardType }
  | { view: 'highest'; board: BoardType };

export type RenderPayload = {
  self: {
    current_pos: null | [number | null, number | null, number | null];
    current_piece_type: null | string;
    current_piece_shape: any;
    board: BoardType;
    hold_piece_type: null | string;
    next_piece_types: string[] | null;
    score:number|null;
  };
  opponents: Record<string, OpponentRender>;
};

