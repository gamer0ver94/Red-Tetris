#!/usr/bin/env bash
set -euo pipefail

docker compose up -d server

docker compose exec -T server node --input-type=module <<'NODE'
import { io } from "socket.io-client";

const baseUrl = process.env.TETRIS_URL || "http://127.0.0.1:1800";
const username = `cli_${Date.now()}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  let lastError;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          "content-type": "application/json",
          ...(options.headers || {}),
        },
      });

      const text = await response.text();
      let body;

      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = { raw: text };
      }

      if (!response.ok) {
        throw new Error(
          `${options.method || "GET"} ${path} -> ${response.status}: ${JSON.stringify(body)}`,
        );
      }

      return { response, body };
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }

  throw lastError;
}

function readCookie(response) {
  const setCookie =
    response.headers.getSetCookie?.()[0] ||
    response.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("No set-cookie header returned by /auth/register");
  }

  return setCookie.split(";")[0];
}

function asRows(board) {
  if (Array.isArray(board)) {
    return board;
  }
  if (board && typeof board === "object") {
    return Object.values(board);
  }
  return [];
}

function drawBoard(board) {
  const rows = asRows(board);
  const width = rows[0]?.length || 10;
  const border = `+${"--".repeat(width)}+`;
  const body = rows.map((row) => {
    const cells = asRows(row)
      .map((cell) => (cell === "." ? " ." : ` ${cell}`))
      .join("");

    return `|${cells}|`;
  });

  return [border, ...body, border].join("\n");
}

function render(payload) {
  process.stdout.write("\x1Bc");
  console.log("Red Tetris CLI");
  console.log(`user: ${username}`);
  console.log(`piece: ${payload.self.current_piece_type ?? "-"} @ ${JSON.stringify(payload.self.current_pos)}`);
  console.log(drawBoard(payload.self.board));

  const opponentNames = Object.keys(payload.opponents || {});
  if (opponentNames.length) {
    console.log("\nopponents:");
    for (const name of opponentNames) {
      console.log(`\n${name}`);
      console.log(drawBoard(payload.opponents[name]));
    }
  }
}

console.log(`Registering ${username} on ${baseUrl}...`);
const registered = await request("/auth/register", {
  method: "POST",
  body: JSON.stringify({ username }),
});

const cookie = readCookie(registered.response);
const csrfToken = registered.body.csrf_token;

console.log("Creating single player classic game...");
await request("/game/create", {
  method: "POST",
  headers: {
    cookie,
    "x-csrf-token": csrfToken,
  },
  body: JSON.stringify({
    game_type: "single_player",
    game_mode: "classic",
  }),
});

console.log("Opening socket...");
const socket = io(baseUrl, {
  transports: ["websocket"],
  auth: { csrf_token: csrfToken },
  extraHeaders: { cookie },
});

function leaveAndClose() {
  socket.emit("lobby:leave");
  socket.close();
}

socket.on("connect", () => {
  console.log(`socket connected: ${socket.id}`);
  socket.emit("lobby:start");
});

socket.on("connect_error", (error) => {
  console.error("socket connect_error:", error.message);
  process.exitCode = 1;
});

socket.on("lobby:start:error", (payload) => {
  console.error("lobby:start:error:", payload);
  process.exitCode = 1;
  socket.close();
});

socket.on("game:error", (payload) => {
  console.error("game:error:", payload);
});

socket.on("game:render", render);

process.on("SIGINT", () => {
  leaveAndClose();
  process.exit(0);
});

await sleep(120000);
leaveAndClose();
NODE
