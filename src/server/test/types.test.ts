import type { FastifyInstance } from 'fastify';
import type { Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/socket_event_types.js';
import type { BoardCell } from '../types/game_types.js';

export type TestAuthUser = {
  username: string;
  cookie: string;
  csrf_token: string;
  player_id: string;
};

export type TestSocketClient = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export type TestSocketServer = {
  app: FastifyInstance;
  baseUrl: string;
};

export type MoveKey = 'left' | 'right' | 'soft' | 'hard' | 'rotate';
export const VALID_BOARD_CELLS = new Set<BoardCell>(['.', 'X', 'I', 'J', 'L', 'S', 'T', 'Z', 'O']);
