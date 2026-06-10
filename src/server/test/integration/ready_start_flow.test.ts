import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { register_user, unique_username, inject_as } from '../helpers/auth_helpers.test.js';

describe('integration: ready start flow', () => {

    describe('events: ready', () => {

        it('reject ready without lobby', async() => {

        });
        //create game

        //join game

        it('set players ready, once in game', async() => {

        });
    });

    describe('events: start', () => {

        //create game

        //join game

        it('reject if not all ready', async() => {

        });

        //set all_ready

        it('reject if not host', async() => {

        });

        it('start the game if host', async() => {
            
        });
    });
});