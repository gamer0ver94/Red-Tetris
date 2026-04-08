import type { FastifyInstance } from 'fastify';
import { auth_routes } from '../routes/auth_routes.ts';

// all exposed routes 
export const register_routes = async (fastify: FastifyInstance) => {
  
  // starts with /auth
  await fastify.register(auth_routes, { prefix: '/auth' });

};