import { describe, expect, it } from 'vitest';

import { evaluate_end_game } from '../../../core/end_game.js';
import type { EndGamePlayerState } from '../../../types/game_types.js';
import { expect_function_pure } from '../../helpers/expect_helpers.test.js';

describe('core: end_game', () => {
    it('treats a single dead player as a loser with no winners', () => {
        const players = [
            make_player('p1', false, 25, 3),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'survival',
            null,
        )).toEqual({
            finished: true,
            winners_id: [],
            losers_id: ['p1'],
        });
    });

    it('resolves all-dead multiplayer games by highest score with ties', () => {
        const players = [
            make_player('p1', false, 10, 1),
            make_player('p2', false, 30, 2),
            make_player('p3', false, 30, 4),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'first_lost',
            null,
        )).toEqual({
            finished: true,
            winners_id: ['p2', 'p3'],
            losers_id: ['p1'],
        });
    });

    it('keeps first_lost unfinished until at least one player dies', () => {
        const players = [
            make_player('p1', true, 0, 0),
            make_player('p2', true, 10, 1),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'first_lost',
            null,
        )).toEqual({ finished: false });
    });

    it('ends first_lost when one or more players are dead', () => {
        const players = [
            make_player('p1', true, 12, 2),
            make_player('p2', false, 30, 3),
            make_player('p3', false, 5, 1),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'first_lost',
            null,
        )).toEqual({
            finished: true,
            winners_id: ['p1'],
            losers_id: ['p2', 'p3'],
        });
    });

    it('ends survival only when one multiplayer player remains alive', () => {
        const unfinished = [
            make_player('p1', true, 0, 0),
            make_player('p2', true, 0, 0),
            make_player('p3', false, 0, 0),
        ];
        const finished = [
            make_player('p1', true, 5, 1),
            make_player('p2', false, 20, 2),
            make_player('p3', false, 10, 1),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            unfinished,
            'survival',
            null,
        )).toEqual({ finished: false });

        expect(expect_function_pure(
            evaluate_end_game,
            finished,
            'survival',
            null,
        )).toEqual({
            finished: true,
            winners_id: ['p1'],
            losers_id: ['p2', 'p3'],
        });
    });

    it('uses only line-limit candidates and highest score to resolve lines games', () => {
        const players = [
            make_player('p1', true, 90, 1),
            make_player('p2', true, 120, 2),
            make_player('p3', true, 120, 3),
            make_player('p4', true, 60, 2),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'lines',
            2,
        )).toEqual({
            finished: true,
            winners_id: ['p2', 'p3'],
            losers_id: ['p1', 'p4'],
        });
    });

    it('keeps score games unfinished until the score limit is reached', () => {
        const players = [
            make_player('p1', true, 80, 0),
            make_player('p2', true, 90, 0),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'score',
            100,
        )).toEqual({ finished: false });
    });

    it('resolves score games with tied winners once the limit is reached', () => {
        const players = [
            make_player('p1', true, 150, 2),
            make_player('p2', true, 90, 4),
            make_player('p3', true, 150, 1),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'score',
            100,
        )).toEqual({
            finished: true,
            winners_id: ['p1', 'p3'],
            losers_id: ['p2'],
        });
    });

    it('keeps time games unfinished without timing data or before the limit', () => {
        const players = [
            make_player('p1', true, 10, 0),
            make_player('p2', true, 20, 0),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'time',
            100,
        )).toEqual({ finished: false });

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'time',
            100,
            1099,
            1000,
        )).toEqual({ finished: false });
    });

    it('resolves time games by highest score once the limit expires', () => {
        const players = [
            make_player('p1', true, 50, 0),
            make_player('p2', true, 70, 0),
            make_player('p3', true, 70, 0),
        ];

        expect(expect_function_pure(
            evaluate_end_game,
            players,
            'time',
            100,
            1100,
            1000,
        )).toEqual({
            finished: true,
            winners_id: ['p2', 'p3'],
            losers_id: ['p1'],
        });
    });
});

function make_player(
    player_id: string,
    alive: boolean,
    score: number,
    lines: number,
): EndGamePlayerState {
    return {
        player_id,
        alive,
        score,
        lines,
    };
}
