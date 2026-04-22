import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import * as BUILD from './build_server.ts';

describe('build_server', () => {

  let app;

  beforeAll(async() => {
    process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
    process.env.CLIENT_ORIGIN = 'http://localhost:1700';
    app = await BUILD.build_server();
  });

  afterAll(async() => {
    await app.close();
  });

  describe('build_server: init', async () => {
    
    it('create fasity and decorate store', () => {
      expect(app).toBeDefined();
      expect(app.store).toBeDefined();
    });

    it('healthcheck route is reachable', async () => {
      const res = await app.inject({
        method:'GET',
        url:'/auth/health'
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('build_server: connection', () => {
    
    it('initializes socket server', () => {
      expect(app.io).toBeDefined();
      const any_io = app.io as any;
      const orgin = any_io?._opts.cors?.orgin ?? any_io?.opts?.cors?.origin;
      expect(orgin).toBe(process.env.CLIENT_ORIGIN ?? 'http://localhost:1700');
    });

    it('applies CORS for allowed origin', async () => {
      const res = await app.inject({
        method:'OPTIONS',
        url:'/auth/health',
        headers:{
          origin: 'http://localhost:1700',
          'access-control-request-method': 'GET',
        },
      });
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:1700');
    });

    it('register session cookie + csrf token', async () => {
      const username = 'register test';

      const res = await app.inject({
        method:'POST',
        url: '/auth/register',
        payload : {username},
      });
      expect(res.statusCode).toBe(201);

      const body = res.json();
      expect(body.csrf_token).toBeDefined();

      const set_cookie = res.headers['set-cookie'];
      expect(set_cookie).toBeDefined();

      const cookie = Array.isArray(set_cookie) ? set_cookie.join(';'): String(set_cookie);
      expect(cookie).toContain('rt.sid=');
    });
  });

  describe('build_server: docs', () => {

    it('swagger route is reachable', async () => {
      const res = await app.inject({
        method:'GET',
        url: '/docs/routes',
        headers: {
          origin: 'http://localhost:1800'
        },
      });
      expect(res.statusCode).toBe(200);
    });

    it('async-api route is reachable', async () => {
      const res = await app.inject({
        method:'GET',
        url: '/docs/sockets',
        headers: {
          origin: 'http://localhost:1800'
        },
      });
      expect(res.statusCode).toBe(200);
    });

    it('init_swager returns meta data', async() => {
      const tmp_app = Fastify();
      const meta = await BUILD.init_swagger(tmp_app);
      expect(meta.route_prefix).toBe('/docs/routes');
      expect(meta.open_api_version).toBe('3.0.3');
      await tmp_app.close();
    });

    it('init_async_api returns meta data', async() => {
      const tmp_app = Fastify();
      const meta = await BUILD.init_async_api(tmp_app);
      expect(meta.prefix).toBe('/docs/sockets');
      expect(meta.registered).toBe(true);
      await tmp_app.close();
    });
  });
});