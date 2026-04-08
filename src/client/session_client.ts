const API_BASE_URL = "http://localhost:1800";
const CSRF_TOKEN_KEY = "red_tetris.csrf_token";

export type RegisterResponse = {
  success: boolean;
  player_id?: string;
  username?: string;
  state?: string;
  csrf_token?: string;
  reason?: string;
};

export type MeResponse = {
  is_known: boolean;
  player_id?: string;
  username?: string;
  state?: string;
  sid?: string;
  socket?: string;
  csrf_token?: string;
};

export function getCsrfToken(): string {
  return sessionStorage.getItem(CSRF_TOKEN_KEY) || "";
}

function setCsrfToken(token: string | undefined): void {
  if (!token) return;
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
}

export async function registerUser(username: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  const data = (await response.json()) as RegisterResponse;
  if (!response.ok) {
    throw new Error(data?.reason || `register failed (${response.status})`);
  }

  setCsrfToken(data?.csrf_token);
  return data;
}

export async function getMe(): Promise<MeResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = (await response.json()) as MeResponse;
  if (!response.ok) {
    throw new Error(`me failed (${response.status})`);
  }

  return data;
}
