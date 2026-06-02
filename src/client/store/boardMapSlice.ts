import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type BoardCell = '.' | 'X' | string;
export type BoardType = BoardCell[][];

type OpponentBoardState = {
  // username -> board
  boardsByUsername: Record<string, BoardType>;
};

const initialState: OpponentBoardState = {
  boardsByUsername: {},
};

const boardMapSlice = createSlice({
  name: 'boardMap',
  initialState,
  reducers: {
    setOpponentBoard: (
      state,
      action: PayloadAction<{ username: string; board: BoardType }>
    ) => {
      const { username, board } = action.payload;
      state.boardsByUsername[username] = board;
    },
    removeOpponentBoard: (state, action: PayloadAction<string>) => {
      delete state.boardsByUsername[action.payload];
    },
    clearBoards: (state) => {
      state.boardsByUsername = {};
    },
  },
});

export const { setOpponentBoard, removeOpponentBoard, clearBoards } = boardMapSlice.actions;
export default boardMapSlice.reducer;

