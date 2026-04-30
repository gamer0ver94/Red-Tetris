import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type GameState = {
  gameId: string | null;
  board: number[][] | null;
}

const initialState: GameState = {
  gameId: null,
  board: null,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {

  },
})


export const {} = gameSlice.actions
export default gameSlice.reducer