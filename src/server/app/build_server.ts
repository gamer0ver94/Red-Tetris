import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { register_routes } from './register_routes.ts';
import { register_sockets } from './register_sockets.ts';
import { Store } from '../stores/store.ts';
import { AppError} from '../models/app_error_model.js';
import { codeType } from '../types/error_code_types.js';

//Bootstrap for server
export const build_server = async () => {
  
    const tlsKeyPath = process.env.TLS_KEY_PATH ?? './src/server/ssl/key.pem';
    const tlsCertPath = process.env.TLS_CERT_PATH ?? './src/server/ssl/cert.pem';
    const hasTls = Boolean(
    tlsKeyPath &&
    tlsCertPath &&
    existsSync(tlsKeyPath) &&
    existsSync(tlsCertPath)
    );

    let fastify: FastifyInstance;
    if (hasTls) {
    const httpsOptions = {
        key: readFileSync(tlsKeyPath),
        cert: readFileSync(tlsCertPath),
    };
    fastify = Fastify({ logger: true, https: httpsOptions as any });
    console.log('Starting HTTPS server using', tlsKeyPath, tlsCertPath);
    } else {
    fastify = Fastify({ logger: true });
    }

    const sessionManagerRaw = process.env.SESSION_MANAGER ?? '';
    if (sessionManagerRaw) {
        const entry = sessionManagerRaw.split(',')[0] || '';
        const afterFirstSlash = entry.includes('/') ? entry.split('/', 2)[1] : entry;
        const firstPart = (afterFirstSlash || '').split(':')[0];
        const host = firstPart.split('.')[0];

        if (host) {
            process.env.CLIENT_ORIGIN = `http${hasTls ? 's' : ''}://${host}:1700`;
            console.log('Detected SESSION_MANAGER host:', host);
            console.log('Set CLIENT_ORIGIN to', process.env.CLIENT_ORIGIN);
        }
    }

    let clientOrigin = process.env.CLIENT_ORIGIN;
    if (!process.env.CLIENT_ORIGIN)
      clientOrigin = "http://localhost:1700"
    console.log('Set  clientOrigin to', clientOrigin);
  
  //cors and secure cookie init 
  await init_cors_and_cookies(fastify, clientOrigin);

  //Cache memory init
  await init_cache_memory(fastify);

  //Errors Handling
  await init_error_handler(fastify);

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
  
  const store = new Store();
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

async function init_error_handler(fastify:FastifyInstance){

  fastify.setErrorHandler((error, request, reply) => {
    
    request.log.error(error);
    if(error instanceof AppError){
      return reply.code(error.status_code).send({
        success:false,
        code:error.code,
        message:error.message,
        details:error.details
      });
    }
    if (error.validation) {
      return reply.code(400).send({
        success: false,
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.validation,
      });
    }
    
    return reply.code(500).send({
      success:false,
      code:'INTERNAL_ERROR',
      message:codeType.INTERNAL_ERROR
    });

  });
}
