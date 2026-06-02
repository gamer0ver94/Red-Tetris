import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'
import gameReducer from './gameSlice'
import boardMapReducer from './boardMapSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    game: gameReducer,
    boardMap: boardMapReducer,
  },
})


// types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
