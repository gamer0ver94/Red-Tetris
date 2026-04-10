import { registerUser, getMe, getCsrfToken } from "./session_client.js";
import { connectSocket } from "./socket_client.js";

const usernameEl = document.getElementById("username") as HTMLInputElement | null;
const logsEl = document.getElementById("logs") as HTMLPreElement | null;
const bannerEl = document.getElementById("socket-banner") as HTMLDivElement | null;

const registerBtn = document.getElementById("register-btn");
const meBtn = document.getElementById("me-btn");
const socketBtn = document.getElementById("socket-btn");

if (!usernameEl || !logsEl || !bannerEl || !registerBtn || !meBtn || !socketBtn) {
  throw new Error("missing UI elements");
}

let socket: { disconnect: () => void } | null = null;

const log = (line: string) => {
  const ts = new Date().toISOString();
  logsEl.textContent += `[${ts}] ${line}\n`;
  logsEl.scrollTop = logsEl.scrollHeight;
};

registerBtn.addEventListener("click", async () => {
  const username = usernameEl.value.trim() || `user_${Date.now()}`;
  try {
    const data = await registerUser(username);
    log(`register success -> ${JSON.stringify(data)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    log(`register error -> ${message}`);
  }
});

meBtn.addEventListener("click", async () => {
  try {
    const data = await getMe();
    log(`/auth/me -> ${JSON.stringify(data)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    log(`/auth/me error -> ${message}`);
  }
});

socketBtn.addEventListener("click", () => {
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    log("missing csrf_token, register first");
    return;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = connectSocket({
    csrfToken,
    onLog: log,
    onConnectedState: () => {
      bannerEl.textContent = "SOCKET ON blabla";
      bannerEl.style.background = "#dcfce7";
    },
  });
});
