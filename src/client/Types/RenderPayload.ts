export type BoardCell = '.' | 'X' | string;

export type BoardType = BoardCell[][];

export type OpponentRender =
  | { view: 'full'; board: BoardType }
  | { view: 'grid'; board: BoardType }
  | { view: 'highest'; board: BoardType };

export type RenderPayload = {
  self: {
    board: BoardType;
    hold_piece_type?: null | string;
    next_piece_types: string[] | null;
    score:number|null;
  };
  opponents: Record<string, OpponentRender>;
};

