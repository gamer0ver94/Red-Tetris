import type { FastifyInstance } from 'fastify'

import * as history_controller from '../controllers/history_controller.ts'

const history_range_query = {
    type: 'object',
    additionalProperties: false,
    properties: {
        start: { type: 'integer', minimum: 0, default: 0 },
        end: { type: 'integer', minimum: 0, default: 10 },
    },
};

const history_date_query = {
     type: 'object',
    additionalProperties: false,
    properties: {
        start: { type: 'integer', minimum: 0, default: 0 },
        end: { type: 'integer', minimum: 0, default: 10 },
        new_first: {type:'boolean', default: true},
    },   
}

export const history_routes = async (fastify: FastifyInstance) =>{
 
    fastify.get('/me', {
        schema: {
            tags: ['history'],
            summary: 'Get current user history',
            querystring: history_range_query,
        },
    }, history_controller.get_me_history);

    fastify.get('/users/:query', {
        schema: {
            tags: ['history'],
            summary: 'Search history entries by username',
            params: {
                type: 'object',
                additionalProperties: false,
                required: ['query'],
                properties: {
                    query: { type: 'string', minLength: 1 },
                },
            },
            querystring: history_range_query,
        },
    }, history_controller.get_users_history);

    fastify.get('/mode/:mode', {
        schema: {
            tags: ['history'],
            summary: 'Get history entries by game mode',
            params: {
                type: 'object',
                additionalProperties: false,
                required: ['mode'],
                properties: {
                    mode: { type: 'string', minLength: 1 },
                },
            },
            querystring: history_range_query,
        },
    }, history_controller.get_mode_history);

    fastify.get('/date', {
        schema: {
            tags: ['history'],
            summary: 'Get history entries sorted by date',
            querystring: history_date_query ,
        },
    }, history_controller.get_date_history);

    fastify.get('/score', {
        schema: {
            tags: ['history'],
            summary: 'Get history entries sorted by score',
            querystring: history_range_query,
        },
    }, history_controller.get_score_history);

    fastify.get('/lobby/:lobby_id', {
        schema: {
            tags: ['history'],
            summary: 'Get history entries by lobby id',
            params: {
                type: 'object',
                additionalProperties: false,
                required: ['lobby_id'],
                properties: {
                    lobby_id: { type: 'string', minLength: 1 },
                },
            },
            querystring: history_range_query,
        },
    }, history_controller.get_lobby_history);

    fastify.get('/win', {
        schema: {
            tags: ['history'],
            summary: 'Get winning history entries',
            querystring: history_range_query,
        },
    }, history_controller.get_win_history);

    fastify.get('/lose', {
        schema: {
            tags: ['history'],
            summary: 'Get losing history entries',
            querystring: history_range_query,
        },
    }, history_controller.get_lose_history);

}
