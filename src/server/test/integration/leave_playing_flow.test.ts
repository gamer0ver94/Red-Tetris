import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { register_user, unique_username, inject_as } from '../helpers/auth_helpers.test.js';

describe('integration: leave playing flow', () => {
    

    //1 create classic game 

    // 2 join game 

    //start

    //1 leave
    it('does not set leaver to win or lose', async() => {

    });

    it('set remaining player as win', async() => {

    });

    //2 send ready
    //2 start
    it('let remaining player restart a game', async() => {

    });

    // 1 create game

    //2  and 3 join

    //1 leave
    it('let remaining players in active game', async() => {

    });
});