import type { FastifyInstance } from 'fastify';
import * as auth_controller from '../controllers/auth_controller.ts';

// only related to auth
export const auth_routes = async (fastify: FastifyInstance) => {
  
  // /auth/me -> to know if user is connected
  fastify.get('/me', {
    schema: {
      tags: ['auth'],
      summary:'Get current session user',
      response: {
        200: {
          type:'object',
          properties:{
            is_known: { type: 'boolean' },
            player_id: { type: 'string' },
            username: { type: 'string' },
            player_status: { type: 'string' },
            socket_id: { type: 'string' },
            csrf_token: { type: 'string' },
          },
          required: ['is_known'],
        },
      },
    },
  }, auth_controller.get_me);
  
  // /auth/register 
  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      summary:'Register a new player',
      body:{
        type:'object',
        required: ['username'],
        properties: {
          username: {type: 'string', minLength:1, description:'unique player username'},
        },
      },
      response: {
        201: {
          type:'object',
          properties:{
            success: {type: 'boolean'},
            player_id: {type: 'string'},
            username: {type: 'string'},
            player_status: {type: 'string'},
            socket_id: {type: 'string'},
            csrf_token: {type: 'string'},
          },
        },
        400:{
          type:'object',
          properties:{
            sucess: {type: 'boolean'},
            reason: {type: 'string'},
          },
        },
        409:{
          type:'object',
          properties:{
            success: {type: 'boolean'},
            reason: {type: 'string'},
          },
        },
      },
    },
  }, auth_controller.post_register);
};