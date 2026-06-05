import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type LobbyReadyState = {
  [username: string]: 'ready' | 'not-ready';
};

type LobbyState = {
  readyByUsername: LobbyReadyState;
};

const initialState: LobbyState = {
  readyByUsername: {},
};

const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    setReadyByUsername: (state, action: PayloadAction<LobbyReadyState>) => {
      state.readyByUsername = action.payload;
    },
    setPlayerReadyStatus: (
      state,
      action: PayloadAction<{ username: string; status: 'ready' | 'not-ready' }>
    ) => {
      const { username, status } = action.payload;
      state.readyByUsername[username] = status;
    },
    playerJoined: (state, action: PayloadAction<{ username: string }>) => {
      const { username } = action.payload;
      if (!(username in state.readyByUsername)) {
        state.readyByUsername[username] = 'not-ready';
      }
    },
    playerLeft: (state, action: PayloadAction<{ username: string }>) => {
      const { username } = action.payload;
      delete state.readyByUsername[username];
    },
    clearLobbyReadyState: (state) => {
      state.readyByUsername = {};
    },
  },
});

export const {
  setReadyByUsername,
  setPlayerReadyStatus,
  playerJoined,
  playerLeft,
  clearLobbyReadyState,
} = lobbySlice.actions;

export default lobbySlice.reducer;

