import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { build_server } from '../../app/build_server.js';
import { register_user, unique_username, inject_as } from '../helpers/test.auth_helpers.js';
import type { TestAuthUser } from '../test.types.js';
import type { HistoryEntry } from '../../types/history_types.js';

describe('integration: history flow', () => {
    let app: FastifyInstance;
    let user: TestAuthUser;
    let history_dir: string;

    beforeAll(async () => {
        process.env.SESSION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64');
        process.env.CLIENT_ORIGIN = 'http://localhost:1700';
        history_dir = mkdtempSync(join(tmpdir(), 'red-tetris-history-'));
        const history_path = join(history_dir, 'test.history.json');
        process.env.HISTORY_PATH = history_path;
        writeFileSync(history_path, `${JSON.stringify(history_entries(), null, 2)}\n`, 'utf8');
        app = await build_server();
        user = await register_user(app, 'history_user');
    });

    afterAll(async () => {
        await app.close();
        delete process.env.HISTORY_PATH;
        rmSync(history_dir, { recursive: true, force: true });
    });

    describe('/me', () => {
        it('rejects if sid is not found', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/history/me',
            });
            const body = res.json();

            expect(res.statusCode).toBe(403);
            expect(body.success).toBe(false);
            expect(body.code).toBe('SID_MISSING');
            expect(body.message).toBeDefined();
        });

        it('only returns history for the current username', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/me',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data.length).toBeGreaterThan(0);
            body.data.forEach((entry: HistoryEntry) => {
                expect_history_entry(entry);
                expect(entry.username).toBe(user.username);
            });
        });

        it('returns empty history for a known user with no entries', async () => {
            const empty_user = await register_user(app, unique_username('history_empty'));
            const res = await inject_as(app, empty_user, {
                method: 'GET',
                url: '/history/me',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data).toEqual([]);
        });
    });

    describe('/users', () => {
        it('returns empty with no match', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/users/no_history_match',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data).toEqual([]);
        });

        it('returns grouped entries for matched usernames', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/users/history_user',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data).toEqual([
                {
                    username: 'history_user',
                    entries: expect.any(Array),
                },
            ]);
            expect(body.data[0].entries.length).toBeGreaterThan(0);
            body.data[0].entries.forEach((entry: HistoryEntry) => {
                expect_history_entry(entry);
                expect(entry.username).toBe('history_user');
            });
        });
    });

    describe('/win', () => {
        it('only returns won history', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/win',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data.length).toBeGreaterThan(0);
            body.data.forEach((entry: HistoryEntry) => {
                expect_history_entry(entry);
                expect(entry.is_winner).toBe(true);
            });
        });
    });

    describe('/lose', () => {
        it('only returns lost history', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/lose',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data.length).toBeGreaterThan(0);
            body.data.forEach((entry: HistoryEntry) => {
                expect_history_entry(entry);
                expect(entry.is_winner).toBe(false);
            });
        });
    });

    describe('/mode', () => {
        it('returns empty with wrong mode', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/mode/no_history_mode',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data).toEqual([]);
        });

        it('returns only entries for a specific mode', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/mode/battle',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data.length).toBeGreaterThan(0);
            body.data.forEach((entry: HistoryEntry) => {
                expect_history_entry(entry);
                expect(entry.game_mode).toBe('battle');
            });
        });
    });

    describe('/date', () => {
        it('returns newer entries first', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/date?new_first=true',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data.length).toBeGreaterThan(1);
            expect_is_sorted_by_date(body.data, 'desc');
        });

        it('returns older entries first', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/date?new_first=false',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data.length).toBeGreaterThan(1);
            expect_is_sorted_by_date(body.data, 'asc');
        });
    });

    describe('/score', () => {
        it('returns higher score first', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/score',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data.length).toBeGreaterThan(1);
            expect_is_sorted_by_score(body.data);
        });

        it('supports start and end range', async () => {
            const all_res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/score',
            });
            const range_res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/score?start=1&end=3',
            });

            expect(all_res.statusCode).toBe(200);
            expect(range_res.statusCode).toBe(200);
            expect(range_res.json().data).toEqual(all_res.json().data.slice(1, 3));
        });

        it('only has entries where score is not hidden', async () => {
            const res = await inject_as(app, user, {
                method: 'GET',
                url: '/history/score',
            });
            const body = res.json();

            expect(res.statusCode).toBe(200);
            expect(body.data.length).toBeGreaterThan(0);
            body.data.forEach((entry: HistoryEntry) => {
                expect_history_entry(entry);
                expect(entry.is_hidden).toBe(false);
            });
        });
    });
});

function expect_history_entry(value: unknown) {
    expect(value).toMatchObject({
        username: expect.any(String),
        is_winner: expect.any(Boolean),
        score: expect.any(Number),
        is_hidden: expect.any(Boolean),
        game_mode: expect.any(String),
        total_time: expect.any(String),
        end_date: expect.any(String),
        lobby_id: expect.any(String),
    });
}

function expect_is_sorted_by_score(entries: HistoryEntry[]) {
    for (let i = 1; i < entries.length; i += 1)
        expect(entries[i - 1].score).toBeGreaterThanOrEqual(entries[i].score);
}

function expect_is_sorted_by_date(entries: HistoryEntry[], order: 'asc' | 'desc') {
    for (let i = 1; i < entries.length; i += 1) {
        const previous = Date.parse(entries[i - 1].end_date);
        const current = Date.parse(entries[i].end_date);

        if (order === 'desc')
            expect(previous).toBeGreaterThanOrEqual(current);
        else
            expect(previous).toBeLessThanOrEqual(current);
    }
}

function history_entries(): HistoryEntry[] {
    return [
        {
            username: 'history_user',
            is_winner: true,
            score: 500,
            is_hidden: false,
            game_mode: 'battle',
            total_time: '5000',
            end_date: '2026-01-04T00:00:00.000Z',
            lobby_id: 'history-lobby-4',
        },
        {
            username: 'history_user',
            is_winner: false,
            score: 200,
            is_hidden: false,
            game_mode: 'classic',
            total_time: '4000',
            end_date: '2026-01-03T00:00:00.000Z',
            lobby_id: 'history-lobby-3',
        },
        {
            username: 'other_user',
            is_winner: true,
            score: 300,
            is_hidden: false,
            game_mode: 'battle',
            total_time: '3000',
            end_date: '2026-01-02T00:00:00.000Z',
            lobby_id: 'history-lobby-2',
        },
        {
            username: 'hidden_user',
            is_winner: false,
            score: 1000,
            is_hidden: true,
            game_mode: 'classic',
            total_time: '2000',
            end_date: '2026-01-01T00:00:00.000Z',
            lobby_id: 'history-lobby-1',
        },
    ];
}
