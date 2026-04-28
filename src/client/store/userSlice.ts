import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type UserState = {
  username: string | null,
  csrf_token?: string | null,
}

const initialState: UserState = {
  username: null,
  csrf_token: null,
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
    setCsrfToken: (state, action: PayloadAction<string>) => {
      state.csrf_token = action.payload
    },
    clearCsrfToken: (state) => {
      state.csrf_token = null
    }
  },
})


export const { setUsername, clearUsername , setCsrfToken, clearCsrfToken} = userSlice.actions
export default userSlice.reducer