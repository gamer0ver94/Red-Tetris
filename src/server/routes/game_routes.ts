import { FastifyInstance } from 'fastify'

import * as game_controller from '../controllers/game_lobby_controller.ts'

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
        required: ['game_type', 'game_mode'],
        properties: {
            game_type: { type: 'string', enum: ['single_player', 'multi_player'] },
            game_mode: { type: 'string', enum: ['classic'] }
        }
        },

        response: {
        201: {
            type: 'object',
            additionalProperties: false,
            required: ['success', 'game_id', 'game_type', 'game_mode'],
            properties: {
            success: { type: 'boolean', const: true },
            game_id: { type: 'string' },
            game_type: { type: 'string', enum: ['single_player', 'multi_player'] },
            game_mode: { type: 'string' },
            }
        },
        400: {
            type: 'object',
            properties: { success: { type: 'boolean' }, reason: { type: 'string' } },
            required: ['success', 'reason']
        },
        403: {
            type: 'object',
            properties: { success: { type: 'boolean' }, reason: { type: 'string' } },
            required: ['success', 'reason']
        },
        409: {
            type: 'object',
            properties: { success: { type: 'boolean' }, reason: { type: 'string' } },
            required: ['success', 'reason']
        }
        }
    }
    }, game_controller.post_create);

    fastify.get('/join/:id', {}, game_controller.get_join);
}