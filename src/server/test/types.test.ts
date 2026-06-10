import type { FastifyInstance } from 'fastify';
import type { Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/socket_event_types.js';

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
