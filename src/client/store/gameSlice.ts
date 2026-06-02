import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type GameState = {
  gameId: string | null;
  board: ('.' | 'X' | string)[][] | null;
};

const initialState: GameState = {
  gameId: null,
  board: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setBoard: (state, action: PayloadAction<GameState['board']>) => {
      state.board = action.payload;
    },
    setGameId: (state, action: PayloadAction<string | null>) => {
      state.gameId = action.payload;
    },
  },
});

export const { setBoard, setGameId } = gameSlice.actions;
export default gameSlice.reducer;

