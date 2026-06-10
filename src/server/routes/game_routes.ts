import { FastifyInstance } from 'fastify'

import * as game_controller from '../controllers/game_lobby_controller.ts'
import { GameOptions } from '../types/game_options_types.js';

const GAME_MODE_ENUM = ['classic', 'hard', 'easy', 'solo', 'battle', 'custom'];

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
                game_mode: { type: 'string', enum: GAME_MODE_ENUM },
                options: {
                type: 'object',
                additionalProperties: false,
                required: ['grid', 'pieces', 'gravity', 'garbage', 'scoring', 'win', 'multiplayer'],
                properties: {
                    grid: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['width', 'height', 'invisible', 'revealOnClearMs'],
                    properties: {
                        width: { type: 'integer', minimum: 1 },
                        height: { type: 'integer', minimum: 1 },
                        invisible: { type: 'boolean' },
                        revealOnClearMs: { type: 'integer', minimum: 0 },
                    },
                    },
                    pieces: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['randomSequence', 'sharedSequence', 'allowHold', 'nextPreviewCount'],
                    properties: {
                        randomSequence: { type: 'boolean' },
                        sharedSequence: { type: 'boolean' },
                        allowHold: { type: 'boolean' },
                        nextPreviewCount: { type: 'integer', minimum: 0 },
                    },
                    },
                    gravity: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['tickMs', 'lockDelayMs', 'maxLock', 'softDropMultiplier', 'fallAfterClear', 'speedOnLock'],
                    properties: {
                        tickMs: { type: 'integer', minimum: 1 },
                        lockDelayMs: { type: 'integer', minimum: 0 },
                        maxLock: { type: 'integer', minimum: 0 },
                        softDropMultiplier: { type: 'number', minimum: 1 },
                        fallAfterClear: { type: 'boolean' },
                        speedOnLock: { type: 'boolean' },
                    },
                    },
                    garbage: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['enabled', 'canClear', 'ratio', 'clearCreateGarbage'],
                    properties: {
                        enabled: { type: 'boolean' },
                        canClear: { type: 'boolean' },
                        ratio: { type: 'number', minimum: 0 },
                        clearCreateGarbage: { type: 'boolean' },
                    },
                    },
                    scoring: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['enabled', 'backToBackBonus'],
                    properties: {
                        enabled: { type: 'boolean' },
                        backToBackBonus: { type: 'boolean' },
                    },
                    },
                    win: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['condition', 'limit'],
                    properties: {
                        condition: {
                        type: 'string',
                        enum: ['survival', 'first_lost', 'score', 'lines', 'time'],
                        },
                        limit: {
                        anyOf: [
                            { type: 'integer', minimum: 0 },
                            { type: 'null' },
                        ],
                        },
                    },
                    },
                    multiplayer: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['enabled', 'maxPlayers', 'seeOpponents'],
                    properties: {
                        enabled: { type: 'boolean' },
                        maxPlayers: {
                        anyOf: [
                            { type: 'integer', minimum: 1 },
                            { type: 'null' },
                        ],
                        },
                        seeOpponents: {
                        type: 'string',
                        enum: ['full', 'grid', 'highest', 'none'],
                        },
                    },
                    },
                },
                },
            },
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
