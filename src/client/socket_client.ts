const SOCKET_URL = "http://localhost:1800";

type ConnectSocketArgs = {
  csrfToken: string;
  onLog?: (line: string) => void;
  onConnectedState?: () => void;
};

type SocketLike = {
  id?: string;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  disconnect: () => void;
};

declare global {
  interface Window {
    io: (url: string, options: Record<string, unknown>) => SocketLike;
  }
}

export function connectSocket({ csrfToken, onLog, onConnectedState }: ConnectSocketArgs): SocketLike {
  const socket = window.io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket"],
    auth: {
      csrf_token: csrfToken,
    },
  });

  socket.on("connect", () => {
    onLog?.(`socket connected (id=${socket.id || "n/a"})`);
  });

  socket.on("connect_error", (error) => {
    const errObj = error as { message?: string };
    onLog?.(`socket connect_error: ${errObj?.message || "unknown error"}`);
  });

  socket.on("message", (payload) => {
    const msg = payload as { action?: string; state?: string };
    onLog?.(`socket message: ${JSON.stringify(msg)}`);
    if (msg?.action === "change_state" && msg?.state === "connected") {
      onConnectedState?.();
    }
  });

  socket.on("disconnect", (reason) => {
    onLog?.(`socket disconnected: ${String(reason)}`);
  });

  return socket;
}
