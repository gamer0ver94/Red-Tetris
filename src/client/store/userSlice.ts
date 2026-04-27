import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type UserState = {
  username: string | null
}

const initialState: UserState = {
  username: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload
    },
    clearUsername: (state) => {
      state.username = null
    },
  },
})

export const { setUsername, clearUsername } = userSlice.actions
export default userSlice.reducer