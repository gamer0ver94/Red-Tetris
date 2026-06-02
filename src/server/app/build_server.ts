import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

import { register_routes } from './register_routes.ts';
import { register_sockets } from './register_sockets.ts';
import { PlayerStore } from '../stores/players_store.ts';
import { GameStore } from '../stores/games_store.ts';
import { Store } from '../stores/store.ts';


//Bootstrap for server
export const build_server = async () => {
  
  const fastify = Fastify({ logger: true });
  const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:1700';
  
  //cors and secure cookie init 
  await init_cors_and_cookies(fastify, clientOrigin);

  //Cache memory init
  await init_cache_memory(fastify);

  //Swagger init for clear API docs
  await init_swagger(fastify);

  //AsyncApi init for clear socket docs
  await init_async_api(fastify);

  //HTTP routes init
  await register_routes(fastify);

  //Sockets init
  const io = register_sockets(
      fastify.server,
      fastify.store,
      (cookieValue) => fastify.decodeSecureSession(cookieValue),
      clientOrigin,
    );
  fastify.decorate('io', io);

  return fastify;
};

async function init_cors_and_cookies(fastify: FastifyInstance, clientOrigin: string){
  const sessionSecret = process.env.SESSION_KEY_BASE64
    ?? Buffer.from(process.env.COOKIE_SECRET ?? 'local-dev-cookie-secret-32-bytes-minimum').toString('base64');
  
  await fastify.register(cors, {
    origin: clientOrigin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  });
  await fastify.register(secureSession, {
    key: Buffer.from(sessionSecret, 'base64'),
    cookieName: 'rt.sid',
    cookie:{
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60*60*24,
    }
  });
}

async function init_cache_memory(fastify: FastifyInstance){
  
  //User data
  const player_store = new PlayerStore();
  //Game data
  const game_store = new GameStore();

  const store = new Store(game_store, player_store);
  fastify.decorate('store', store)

}

export async function init_swagger(fastify: FastifyInstance):
Promise<{open_api_version:string, route_prefix:string}>{
  
  const open_api_version = '3.0.3';
  const route_prefix = '/docs/routes';
  await fastify.register(swagger, {
    openapi: {
      openapi: open_api_version,
      info: {
        title: 'Red Tetris API',
        version: '0.1.0',
        description: 'HTTP auth endpoints for Red Tetris',
      },
      servers: [{ url: 'http://localhost:1800' }],
      tags: [{ name: 'auth', description: 'Authentication' }],
      components: {
        securitySchemes: {
          sessionCookie: { type: 'apiKey', in: 'cookie', name: 'rt.sid' },
          csrfHeader: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token' },
        },
      },
    },
  });
  await fastify.register(swaggerUI, {
    routePrefix: route_prefix,
    staticCSP: true,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
  return {open_api_version, route_prefix}
}

export async function init_async_api(fastify: FastifyInstance) : 
  Promise<{root:string, prefix:string, registered:boolean}>{
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const root = join(__dirname, '../docs/asyncapi-site');
  const prefix = '/docs/sockets'

  if (existsSync(root)) {
    await fastify.register(fastifyStatic, {
      root:root,
      prefix: prefix,
      decorateReply: false,
    });
  } else {
    const asyncApiFallback = async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.type('text/html').send('<!doctype html><title>AsyncAPI docs not built</title>');
    };
    fastify.get(prefix, asyncApiFallback);
    fastify.get(`${prefix}/`, asyncApiFallback);
  }

  return {root, prefix, registered:true};
}
