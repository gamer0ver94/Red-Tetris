import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { register_user, unique_username, inject_as } from '../helpers/auth_helpers.test.js';

describe('game core flow', () => {

    //create and join classic game (3 players)
    it('game start with current piece', async() => {
        //check board is not empty
    });

    //u1 move left
    it('move left affect render', async() => {

    });

    // u1 move right
    it('move rigth affect render', async() => {

    });

    //u1 soft drop
    it('soft drop increase speed', async() => {

    });

    //u1 hard drop
    it('lock piece on hard drop', async() => {

    });

    //simulate fake board and fake lines for u1 ? 
    it('line clear update board/lines/score', async() => {

    });

    it('send unclearable garbage to opponents', async() => {

    });
});