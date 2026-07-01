const origin = window.location.origin;
const env = import.meta.env;

const legacyBaseUrl = env.DEV && env.VITE_BASE_URL
  ? `${env.VITE_BASE_URL}${env.VITE_PORT ? `:${env.VITE_PORT}` : ''}`
  : '';

const apiOrigin = env.VITE_API_ORIGIN || legacyBaseUrl || origin;

export const config = {
  url: apiOrigin,
  register: env.VITE_REGISTER ?? '/auth/register',
  createLobby: env.VITE_CREATE_LOBBY ?? '/game/create',
  authMe: env.VITE_AUTH_ME ?? '/auth/me',
  joinLobby: env.VITE_JOIN_LOBBY ?? '/game/join',
};
