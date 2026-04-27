import type { FastifyInstance } from 'fastify';
import { io as ioClient } from 'socket.io-client';
import type { AddressInfo } from 'node:net';

import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from '../../types/socket_event_types.ts';
import type { TestAuthUser, TestSocketClient } from '../test_types.ts';

type FirstArg<F> = F extends (arg: infer A, ...rest: any[]) => any ? A : void;

export type ServerEventPayload<E extends keyof ServerToClientEvents> =
  FirstArg<ServerToClientEvents[E]>;


export async function start_socket_server(app:FastifyInstance): Promise<string>{
    
    await app.listen({host:'127.0.0.1', port:0});

    const addr = app.server.address();
    if( ! addr|| typeof addr === 'string')
        throw new Error(`Can't resolve socket server.`);
    return `http://127.0.0.1:${(addr as AddressInfo).port}`;
}

export async function close_socket_server(app: FastifyInstance): Promise<void> {

  await new Promise<void>((resolve) => {
    const ioAny = app.io as any;
    if (!ioAny?.close) return resolve();
    ioAny.close(() => resolve());
  });

  if (app.server.listening) {
    await app.close();
  }
}

export async function register_socket_client(
    base_url:string,
    user: TestAuthUser,
    opts?: { csrf_token?:string, cookie?:string, wait_for_connect?: boolean, timeout_ms?: number},
) : Promise<TestSocketClient>{

    const socket = ioClient(base_url, {
        transports: ['websocket'],
        reconnection: false,
        forceNew: true,
        auth: { csrf_token: opts?.csrf_token ?? user.csrf_token},
        extraHeaders: {cookie: opts?.cookie ?? user.cookie }
    });

    if (opts?.wait_for_connect !== false)
        await wait_socket_connect(socket, opts?.timeout_ms ?? 1500);
    
    return socket as TestSocketClient;
}

export function send_socket_as<E extends keyof ClientToServerEvents>(
    socket: TestSocketClient,
    event: E,
    ... args: Parameters<ClientToServerEvents[E]>
) : void {
    (socket.emit as any )(event,... args);
}

export function receive_socket_as<E extends keyof ServerToClientEvents>(
    socket: TestSocketClient,
    event:E,
    timeout_ms = 1500,
): Promise<ServerEventPayload<E>>{
    return new Promise( (resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`Timeout waiting for event "${String(event)}"`))
        },timeout_ms);

        const on_event = ((payload:unknown) => {
            cleanup();
            resolve(payload as ServerEventPayload<E>)
        }) as any;

        const cleanup = () => {
            clearTimeout(timer);
            socket.off(event as any, on_event);
        };
        socket.once(event as any, on_event);
    });
}

export function receive_connect_error(
    socket:TestSocketClient,
    timeout_ms = 1500,
): Promise<string>{
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout waiting for socket connection'))
        }, timeout_ms);
        
        const on_error = (err:Error) => {
            cleanup();
            resolve(err?.message ?? 'unknown');
        };

        const cleanup = () => {
            clearTimeout(timer);
            socket.off('connect_error', on_error as any);
        };
        socket.once('connect_error', on_error as any)
    });
}

export function close_socket_client(socket?: TestSocketClient): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.close();
}

async function wait_socket_connect(socket: TestSocketClient, timeoutMs: number): Promise<void> {
  if (socket.connected) return;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout waiting for socket connection'));
    }, timeoutMs);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      socket.off('connect_error', onError as any);
    };

    socket.once('connect', onConnect);
    socket.once('connect_error', onError as any);
  });
}