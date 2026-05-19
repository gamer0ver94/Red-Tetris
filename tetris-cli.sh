#!/usr/bin/env bash
set -euo pipefail

docker compose up -d server

docker compose exec -T server sh -lc 'mkdir -p /app/node_modules/.cache && cat > /app/node_modules/.cache/red-tetris-cli.mjs' <<'NODE'
import { io } from "socket.io-client";

const baseUrl = process.env.TETRIS_URL || "http://127.0.0.1:1800";
const username = `cli_${Date.now()}`;
let lastRender = null;
let inputReady = false;
const RELEASE_AFTER_MS = 90;
const activeDirections = new Set();
const releaseTimers = new Map();
const pieceShapes = {
  I: [
    [".", ".", ".", "."],
    ["I", "I", "I", "I"],
  ],
  J: [
    ["J", ".", ".", "."],
    ["J", "J", "J", "."],
  ],
  L: [
    [".", ".", "L", "."],
    ["L", "L", "L", "."],
  ],
  S: [
    [".", "S", "S", "."],
    ["S", "S", ".", "."],
  ],
  T: [
    [".", "T", ".", "."],
    ["T", "T", "T", "."],
  ],
  Z: [
    ["Z", "Z", ".", "."],
    [".", "Z", "Z", "."],
  ],
  O: [
    [".", "O", "O", "."],
    [".", "O", "O", "."],
  ],
};

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

function rotateShape(shape, rotation) {
  let rotated = shape.map((row) => [...row]);
  const turns = ((rotation || 0) % 4 + 4) % 4;

  for (let turn = 0; turn < turns; turn += 1) {
    rotated = rotated[0].map((_, x) =>
      rotated.map((row) => row[x]).reverse()
    );
  }

  return rotated;
}

function boardWithCurrentPiece(state) {
  const board = asRows(state.self.board).map((row) => [...asRows(row)]);
  const pieceType = state.self.current_piece_type;
  const [pieceX, pieceY, rotation] = state.self.current_pos || [];
  const shape = pieceShapes[pieceType];

  if (!shape || pieceX === null || pieceY === null || pieceX === undefined || pieceY === undefined) {
    return board;
  }

  const rotatedShape = rotateShape(shape, rotation);

  for (let y = 0; y < rotatedShape.length; y += 1) {
    for (let x = 0; x < rotatedShape[y].length; x += 1) {
      const cell = rotatedShape[y][x];
      if (cell === ".") {
        continue;
      }

      const boardY = pieceY + y;
      const boardX = pieceX + x;

      if (
        boardY >= 0 &&
        boardY < board.length &&
        boardX >= 0 &&
        boardX < (board[0]?.length || 0)
      ) {
        board[boardY][boardX] = cell;
      }
    }
  }

  return board;
}

function render(payload) {
  const state = payload?.success && payload?.data ? payload.data : payload;

  if (!state?.self?.board) {
    console.error("Invalid render payload:", payload);
    return;
  }

  lastRender = state;
  process.stdout.write("\x1Bc");
  console.log("Red Tetris CLI");
  console.log(`user: ${username}`);
  console.log("controls: a/left = left, d/right = right, r = rotate, s/down = soft, space/w/up = hard, h = hold, q = quit");
  console.log(`piece: ${state.self.current_piece_type ?? "-"} @ ${JSON.stringify(state.self.current_pos)}`);
  console.log(`hold: ${state.self.hold_piece_type ?? "-"} | next: ${(state.self.next_piece_types || []).join(" ") || "-"}`);
  console.log(drawBoard(boardWithCurrentPiece(state)));

  const opponentNames = Object.keys(state.opponents || {});
  if (opponentNames.length) {
    console.log("\nopponents:");
    for (const name of opponentNames) {
      const opponent = state.opponents[name];
      console.log(`\n${name}`);
      if (opponent.view === "highest") {
        console.log(`highest: ${opponent.highest}`);
      } else {
        console.log(drawBoard(opponent.board));
      }
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

console.log("Creating solo game...");
const created = await request("/game/create", {
  method: "POST",
  headers: {
    cookie,
    "x-csrf-token": csrfToken,
  },
  body: JSON.stringify({
    game_mode: "solo",
  }),
});
const gameId = created.body.game_id;

console.log("Opening socket...");
const socket = io(baseUrl, {
  transports: ["websocket"],
  auth: { csrf_token: csrfToken },
  extraHeaders: { cookie },
});

function redrawLastRender() {
  if (lastRender) {
    render(lastRender);
  }
}

function emitPress(direction) {
  if (activeDirections.has(direction)) {
    return;
  }

  activeDirections.add(direction);
  socket.emit(`game:${direction}:press`);
}

function emitRelease(direction) {
  const timer = releaseTimers.get(direction);
  if (timer) {
    clearTimeout(timer);
    releaseTimers.delete(direction);
  }

  if (!activeDirections.has(direction)) {
    return;
  }

  activeDirections.delete(direction);
  socket.emit(`game:${direction}:release`);
}

function scheduleRelease(direction) {
  const timer = releaseTimers.get(direction);
  if (timer) {
    clearTimeout(timer);
  }

  releaseTimers.set(
    direction,
    setTimeout(() => {
      emitRelease(direction);
    }, RELEASE_AFTER_MS),
  );
}

function handleDirection(direction) {
  const opposite = direction === "left" ? "right" : "left";
  emitRelease(opposite);
  emitPress(direction);
  scheduleRelease(direction);
  redrawLastRender();
}

function handleSoftDrop() {
  emitPress("soft");
  scheduleRelease("soft");
  redrawLastRender();
}

function handleHardDrop() {
  emitRelease("soft");
  socket.emit("game:hard:press");
  setTimeout(() => {
    socket.emit("game:hard:release");
  }, 30);
  redrawLastRender();
}

function handleHold() {
  socket.emit("game:hold");
  redrawLastRender();
}

function handleRotate() {
  socket.emit("game:rotate");
  redrawLastRender();
}

function leaveAndClose() {
  emitRelease("left");
  emitRelease("right");
  emitRelease("soft");
  socket.emit("game:hard:release");
  socket.emit("lobby:leave");
  socket.close();
}

function setupInput() {
  if (inputReady || !process.stdin.isTTY) {
    if (!process.stdin.isTTY) {
      console.log("stdin is not a TTY; keyboard controls are disabled.");
    }
    return;
  }

  inputReady = true;
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", (key) => {
    if (key === "\u0003" || key === "q") {
      leaveAndClose();
      process.exit(0);
    }

    if (key === "a" || key === "\u001b[D") {
      handleDirection("left");
    }

    if (key === "d" || key === "l" || key === "\u001b[C") {
      handleDirection("right");
    }

    if (key === "s" || key === "j" || key === "\u001b[B") {
      handleSoftDrop();
    }

    if (key === " " || key === "w" || key === "k" || key === "\u001b[A") {
      handleHardDrop();
    }

    if (key === "h") {
      handleHold();
    }

    if (key === "r") {
      handleRotate();
    }
  });
}

socket.on("connect", () => {
  console.log(`socket connected: ${socket.id}`);
  console.log(`starting game ${gameId}...`);
  socket.emit("lobby:start");
  setupInput();
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

socket.on("lobby:start:success", () => {
  console.log("lobby:start:success");
});

socket.on("lobby:leave:error", (payload) => {
  console.error("lobby:leave:error:", payload);
});

socket.on("session:resume", (payload) => {
  console.log("session:resume:", JSON.stringify(payload));
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

if [ -t 0 ]; then
  docker compose exec server node /app/node_modules/.cache/red-tetris-cli.mjs
else
  docker compose exec -T server node /app/node_modules/.cache/red-tetris-cli.mjs
fi
