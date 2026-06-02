import type { Server as SocketIOServer } from 'socket.io';
import type { Store } from '../stores/store.ts';

declare module 'fastify' {
  interface FastifyInstance {
    store: Store;
    io: SocketIOServer;
  }
}
