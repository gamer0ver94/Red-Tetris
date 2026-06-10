import type { FastifyInstance } from 'fastify';
import * as auth_controller from '../controllers/auth_controller.ts';
import { playerStatusType } from '../types/status_types.ts';
import { ERROR_RESPONSE_SCHEMA } from '../types/error_code_types.js';
const PLAYER_STATUS_ENUM = Object.values(playerStatusType);


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
            player_status: { type: 'string', enum:PLAYER_STATUS_ENUM },
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
          username: {type: 'string', description:'unique player username'},
        },
      },
      response: {
        201: {
          type:'object',
          properties:{
            success: {type: 'boolean'},
            player_id: {type: 'string'},
            username: {type: 'string'},
            player_status: {type: 'string', enum:PLAYER_STATUS_ENUM},
            socket_id: {type: 'string'},
            csrf_token: {type: 'string'},
          },
        },
        400:ERROR_RESPONSE_SCHEMA,
        409:ERROR_RESPONSE_SCHEMA,
      },
    },
  }, auth_controller.post_register);

  // /auth/health to have a healthcheck endpoint
  fastify.get('/health', async () => ({ok: true}))

  // /auth/logout to logout a user
    fastify.get('/logout', {
        schema: {
            tags:['auth'],
            summary:'Logout current user',
            response: {
                200: {
                    type:'object',
                    properties:{
                        success: {type: 'boolean'},
                    },
                },
                403:ERROR_RESPONSE_SCHEMA,
            },
         },
    } , auth_controller.logout);
}