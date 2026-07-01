import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HistoryEntry } from '../../../types/history_types.js';

const fs_mocks = vi.hoisted(() => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
    existsSync: fs_mocks.existsSync,
    readFileSync: fs_mocks.readFileSync,
    writeFileSync: fs_mocks.writeFileSync,
}));

import { HistoryProvider } from '../../../models/history_provider.js';

describe('HistoryProvider', () => {
    beforeEach(() => {
        fs_mocks.existsSync.mockReset();
        fs_mocks.readFileSync.mockReset();
        fs_mocks.writeFileSync.mockReset();
    });

    it('returns empty history when the file is missing, empty, or invalid', () => {
        fs_mocks.existsSync.mockReturnValue(false);
        expect(HistoryProvider.read_history()).toEqual([]);

        fs_mocks.existsSync.mockReturnValue(true);
        fs_mocks.readFileSync.mockReturnValue('');
        expect(HistoryProvider.read_history()).toEqual([]);

        fs_mocks.readFileSync.mockReturnValue('{not-json');
        expect(HistoryProvider.read_history()).toEqual([]);
    });

    it('filters invalid history entries while reading', () => {
        const valid_1 = create_entry({
            username: 'alice',
            score: 100,
            end_date: '2026-01-03T00:00:00.000Z',
        });
        const valid_2 = create_entry({
            username: 'bob',
            score: 80,
            end_date: '2026-01-02T00:00:00.000Z',
        });

        fs_mocks.existsSync.mockReturnValue(true);
        fs_mocks.readFileSync.mockReturnValue(JSON.stringify([
            valid_1,
            { username: 'broken' },
            valid_2,
        ]));

        expect(HistoryProvider.read_history()).toEqual([valid_1, valid_2]);
    });

    it('prepends new entries when writing history', () => {
        const older = create_entry({
            username: 'older',
            score: 50,
            end_date: '2026-01-01T00:00:00.000Z',
        });
        const newer = create_entry({
            username: 'newer',
            score: 150,
            end_date: '2026-01-04T00:00:00.000Z',
        });

        fs_mocks.existsSync.mockReturnValue(true);
        fs_mocks.readFileSync.mockReturnValue(JSON.stringify([older]));
        fs_mocks.writeFileSync.mockImplementation(() => undefined);

        expect(HistoryProvider.add_entry(newer)).toBe(true);
        expect(fs_mocks.writeFileSync).toHaveBeenCalledWith(
            get_expected_history_path(),
            `${JSON.stringify([newer, older], null, 2)}\n`,
            'utf8',
        );
    });

    it('uses the default history path when no override is configured', () => {
        const history_path = process.env.HISTORY_PATH;
        delete process.env.HISTORY_PATH;

        try {
            fs_mocks.existsSync.mockReturnValue(true);
            fs_mocks.readFileSync.mockReturnValue(JSON.stringify([]));
            fs_mocks.writeFileSync.mockImplementation(() => undefined);

            expect(HistoryProvider.add_entry(create_entry())).toBe(true);
            expect(fs_mocks.writeFileSync).toHaveBeenCalledWith(
                '/app/history.json',
                expect.any(String),
                'utf8',
            );
        }
        finally {
            if(history_path !== undefined)
                process.env.HISTORY_PATH = history_path;
        }
    });

    it('returns false when writing history fails', () => {
        const newer = create_entry({ username: 'newer' });

        fs_mocks.existsSync.mockReturnValue(true);
        fs_mocks.readFileSync.mockReturnValue(JSON.stringify([]));
        fs_mocks.writeFileSync.mockImplementation(() => {
            throw new Error('disk full');
        });

        expect(HistoryProvider.add_entry(newer)).toBe(false);
    });

    it('sorts and slices history by date and score', () => {
        const entries = [
            create_entry({
                username: 'alice',
                score: 50,
                is_hidden: false,
                end_date: '2026-01-01T00:00:00.000Z',
            }),
            create_entry({
                username: 'bob',
                score: 200,
                is_hidden: true,
                end_date: '2026-01-03T00:00:00.000Z',
            }),
            create_entry({
                username: 'carol',
                score: 120,
                is_hidden: false,
                end_date: '2026-01-02T00:00:00.000Z',
            }),
        ];

        mock_history(entries);

        expect(HistoryProvider.get_history_by_date(true, 0, 2)).toEqual([
            entries[1],
            entries[2],
        ]);
        expect(HistoryProvider.get_history_by_date(false, 1, 3)).toEqual([
            entries[2],
            entries[1],
        ]);
        expect(HistoryProvider.get_history_by_score(0, 5)).toEqual([
            entries[2],
            entries[0],
        ]);
    });

    it('filters history by username, mode, lobby, win/lose, and grouped username search', () => {
        const entries = [
            create_entry({
                username: 'alice',
                is_winner: true,
                score: 100,
                game_mode: 'classic',
                lobby_id: 'lobby-1',
                end_date: '2026-01-03T00:00:00.000Z',
            }),
            create_entry({
                username: 'alicia',
                is_winner: false,
                score: 80,
                game_mode: 'hard',
                lobby_id: 'lobby-2',
                end_date: '2026-01-02T00:00:00.000Z',
            }),
            create_entry({
                username: 'alice',
                is_winner: false,
                score: 60,
                game_mode: 'classic',
                lobby_id: 'lobby-1',
                end_date: '2026-01-01T00:00:00.000Z',
            }),
        ];

        mock_history(entries);

        expect(HistoryProvider.get_history_by_username('alice', 0, 5)).toEqual([
            entries[0],
            entries[2],
        ]);
        expect(HistoryProvider.get_history_by_mode('classic', 0, 5)).toEqual([
            entries[0],
            entries[2],
        ]);
        expect(HistoryProvider.get_history_by_lobby_id('lobby-2', 0, 5)).toEqual([
            entries[1],
        ]);
        expect(HistoryProvider.get_history_by_win(0, 5)).toEqual([entries[0]]);
        expect(HistoryProvider.get_history_by_lose(0, 5)).toEqual([
            entries[1],
            entries[2],
        ]);
        expect(HistoryProvider.search_username_in_history('', 0, 5)).toEqual([]);
        expect(HistoryProvider.search_username_in_history('ali', 0, 1)).toEqual([
            {
                username: 'alice',
                entries: [entries[0]],
            },
            {
                username: 'alicia',
                entries: [entries[1]],
            },
        ]);
    });
});

function mock_history(entries: HistoryEntry[]): void {
    fs_mocks.existsSync.mockReturnValue(true);
    fs_mocks.readFileSync.mockReturnValue(JSON.stringify(entries));
}

function get_expected_history_path(): string {
    return process.env.HISTORY_PATH ?? '/app/history.json';
}

function create_entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
    return {
        username: 'player',
        is_winner: true,
        score: 10,
        is_hidden: false,
        game_mode: 'classic',
        total_time: '1000',
        end_date: '2026-01-01T00:00:00.000Z',
        lobby_id: 'lobby-1',
        ...overrides,
    };
}
