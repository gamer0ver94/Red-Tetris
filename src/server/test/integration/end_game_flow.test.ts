
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { build_server } from '../../app/build_server.js';
import { register_user, unique_username, inject_as } from '../helpers/auth_helpers.test.js';

describe('integration: end game flow', () => {
    
    describe('game dead flow', () => {
        //1 create solo game 
        it('stop game when solo dies', async() => {

        });
        //2 + 3 join
        it('stop fame when only one remains', async() => {

        });

        // create custom with limit time 100000
        it('stop game if all dead', async() => {

        });
    });

    describe('game limit flow', () => {

        //create and join custom with limit time 100?

        //manually add some score to a player

        it('stop game at time limit', async() => {

        });

        //create and join custom with limit score 100
        //add score

        it('stop game at score limit', async() =>{

        });

        //create and join custom with limit lines 1
        //add lines
        it('stop game at lines limit', async() => {

        });

        //create and join custom with limit score 100
        //add same score to all
        it('allowed multiple winner on score tie', async() => {
            
        });

    })
});