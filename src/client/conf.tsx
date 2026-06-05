const env = import.meta.env;

export const config = {
  url: `${env.VITE_BASE_URL}:${env.VITE_PORT}`,
  register: env.VITE_REGISTER,
  createLobby: env.VITE_CREATE_LOBBY,
  authMe: env.VITE_AUTH_ME,
  joinLobby: env.VITE_JOIN_LOBBY,
};