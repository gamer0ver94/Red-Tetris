import type { FastifyInstance } from 'fastify';
import * as auth_controller from '../controllers/auth_controller.ts';

// only related to auth
export const auth_routes = async (fastify: FastifyInstance) => {
  
  // /auth/me -> to know if user is connected
  fastify.get('/me', auth_controller.get_me);
  
  // /auth/register 
  fastify.post('/register', auth_controller.post_register);
};