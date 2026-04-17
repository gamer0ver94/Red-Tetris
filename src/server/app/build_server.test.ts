import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import * as BUILD from '../app/build_server.ts';

describe('build_server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
    app = await BUILD.build_server();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers auth health route', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('decorates fastify with store and io', () => {
    expect(app.store).toBeDefined();
    expect(app.io).toBeDefined();
  });

  it('init_swagger, returns expected meta data', async() => {
    const app = Fastify();
    const meta = await BUILD.init_swagger(app);
    expect(meta.route_prefix).toBe('/docs/routes');
    expect(meta.open_api_version).toBe('3.0.3');
    await app.close()
  });

  it('swagger route is reachable', async() => {
    const res = await app.inject({method: 'GET', url:'/docs/routes'});
    expect(res.statusCode).toBe(200);
  });

  it ('init_async_api, returns expected meta data', async() => {
    const app = Fastify();
    const meta = await BUILD.init_async_api(app);
    expect(meta.prefix).toBe('/docs/sockets');
    expect(meta.registered).toBe(true);
    await app.close();
  });

  it('async-api is reachable',async() => {
    const res = await app.inject({method: 'GET', url:'/docs/sockets'});
    expect(res.statusCode).toBe(200);
  });

  it('CORS: allowed origin is returned', async() => {
    delete process.env.CLIENT_ORIGIN;
    process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');

    const res = await app.inject({
        method:'OPTIONS',
        url: '/auth/health',
        headers: {
            origin: 'http://localhost:1700',
            'access-control-request-method': 'GET',
        },
    });
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:1700');
  });

  it('CORS: different origin is not echoed back', async() => {
    delete process.env.CLIENT_ORIGIN;
    process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');

    const res = await app.inject({
        method:'OPTIONS',
        url: '/auth/health',
        headers: {
            origin: 'http://localhost',
            'access-control-request-method': 'GET',
        },
    });
    expect(res.headers['access-control-allow-origin']).not.toBe('http://localhost');
  })
});
