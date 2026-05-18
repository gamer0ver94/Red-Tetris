import { FastifyInstance } from 'fastify'

import * as game_controller from '../controllers/game_lobby_controller.ts'

const GAME_MODE_ENUM = ['classic', 'hard', 'easy', 'solo', 'battle'];

export const game_routes = async (fastify: FastifyInstance) => {

    fastify.post('/create', {schema: {
        tags: ['game'],
        summary: 'Create a new game lobby',
        security: [{ sessionCookie: [] }, { csrfHeader: [] }],

        headers: {
        type: 'object',
        properties: {
            'x-csrf-token': { type: 'string', minLength: 32, maxLength: 128 }
        },
        additionalProperties: true
        },

        body: {
        type: 'object',
        additionalProperties: false,
        required: ['game_mode'],
        properties: {
            game_mode: { type: 'string', enum: GAME_MODE_ENUM }
        }
        },

        response: {
        201: {
            type: 'object',
            additionalProperties: false,
            required: ['success', 'game_id'],
            properties: {
            success: { type: 'boolean', const: true },
            game_id: { type: 'string' },
            }
        },
        400: {
            type: 'object',
            properties: { success: { type: 'boolean' }, code: { type: 'string' }, message: { type: 'string' } },
            required: ['success', 'code', 'message']
        },
        403: {
            type: 'object',
            properties: { success: { type: 'boolean' }, code: { type: 'string' }, message: { type: 'string' } },
            required: ['success', 'code', 'message']
        },
        409: {
            type: 'object',
            properties: { success: { type: 'boolean' }, code: { type: 'string' }, message: { type: 'string' } },
            required: ['success', 'code', 'message']
        }
        }
    }
    }, game_controller.post_create);

    fastify.get('/join/:game_id/:username', {
        schema:{
            tags:['game'],
            summary: 'Prepare a player to join a game lobby',
            params: {
                type: 'object',
                additionalProperties: false,
                required: ['game_id', 'username'],
                properties: {
                    game_id: { type: 'string', minLength: 1 },
                    username: { type: 'string', minLength: 1, maxLength: 32 },
            },
            },
            response: {
                200: {
                    type: 'object',
                    additionalProperties: false,
                    required: [
                    'success',
                    'game_id',
                    'player_id',
                    'username',
                    'csrf_token',
                    'game_status',
                    'is_host',
                    ],
                    properties: {
                    success: { type: 'boolean', const: true },
                    game_id: { type: 'string' },
                    player_id: { type: 'string' },
                    username: { type: 'string' },
                    csrf_token: { type: 'string' },
                    game_status: { type: 'string', enum: ['created', 'waiting', 'started', 'finish'] },
                    is_host: { type: 'boolean' },
                    },
                },
                400: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['success', 'reason'],
                    properties: {
                    success: { type: 'boolean', const: false },
                    reason: { type: 'string' },
                    },
                },
                403: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['success', 'reason'],
                    properties: {
                    success: { type: 'boolean', const: false },
                    reason: { type: 'string' },
                    },
                },
                404: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['success', 'reason'],
                    properties: {
                    success: { type: 'boolean', const: false },
                    reason: { type: 'string' },
                    },
                },
                409: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['success', 'reason'],
                    properties: {
                    success: { type: 'boolean', const: false },
                    reason: { type: 'string' },
                    },
                },
            },
        },
    }, game_controller.get_join);
}
