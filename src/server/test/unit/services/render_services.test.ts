import { describe, expect, it } from 'vitest';

import { ActiveGame } from '../../../models/active_game_model.js';
import { Board } from '../../../models/board_model.js';
import { Piece } from '../../../models/piece_model.js';
import { Player } from '../../../models/player_model.js';
import { PlayerInGame } from '../../../models/player_in_game_model.js';
import { Store } from '../../../stores/store.js';
import { build_render_payload } from '../../../services/game_render_services.js';
import { CLASSIC_OPTS } from '../../../types/pre_made_options.js';
import { playerStatusType } from '../../../types/status_types.js';
import type { BoardType } from '../../../types/game_types.js';
import type { GameOptions } from '../../../types/game_options_types.js';

describe('services: game_render_services', () => {
    it('renders self board with preview, null score, and highest opponent view', () => {
        const ctx = create_render_context('highest');

        const payload = build_render_payload(ctx.game, 'p1', ctx.store);

        expect(payload.success).toBe(true);
        if (!payload.success)
            throw new Error('Expected render payload');
        expect(payload.data.self.next_piece_types).toHaveLength(CLASSIC_OPTS.pieces.nextPreviewCount);
        expect(payload.data.self.score).toBeNull();
        expect(payload.data.self.board.flat().some((cell) => cell === 'T')).toBe(true);
        expect(payload.data.opponents.bob.view).toBe('highest');
        expect(payload.data.opponents.bob.board).toHaveLength(CLASSIC_OPTS.grid.height);
    });

    it('renders score, invisible self board, clear phase frame, and missing opponent username fallback', () => {
        const ctx = create_render_context('grid', {
            grid: {
                ...CLASSIC_OPTS.grid,
                invisible: true,
                showLockHighlight: false,
            },
            scoring: {
                ...CLASSIC_OPTS.scoring,
                enabled: true,
            },
        });
        const player = ctx.game.get_player('p1');
        expect(player.success).toBe(true);
        if (!player.success)
            throw new Error('Expected player');
        player.data.set_score(321);
        player.data.set_clear_phase({
            mode: 'regular',
            frames: [[['X']]],
            frame_index: 0,
            next_frame_at: 0,
            final_board: [['.']],
            cleared_lines: 1,
            cleared_garbage: 0,
        });
        ctx.store.get_player_store().remove_player(ctx.opponent_user);

        const payload = build_render_payload(ctx.game, 'p1', ctx.store);

        expect(payload.success).toBe(true);
        if (!payload.success)
            throw new Error('Expected render payload');
        expect(payload.data.self.score).toBe(321);
        expect(payload.data.self.board).toEqual([['X']]);
        expect(payload.data.opponents['Username Not Found'].view).toBe('grid');
    });

    it('supports full and none opponent modes', () => {
        const full_ctx = create_render_context('full');
        const full = build_render_payload(full_ctx.game, 'p1', full_ctx.store);
        const none_ctx = create_render_context('none');
        const none = build_render_payload(none_ctx.game, 'p1', none_ctx.store);

        expect(full.success).toBe(true);
        if (full.success)
            expect(Object.values(full.data.opponents)[0].view).toBe('full');
        expect(none.success).toBe(true);
        if (none.success)
            expect(none.data.opponents).toEqual({});
    });

    it('returns player lookup errors', () => {
        const ctx = create_render_context('highest');

        expect(build_render_payload(ctx.game, 'missing', ctx.store)).toEqual({
            success: false,
            code: 'PLAYER_NOT_FOUND',
        });
    });
});

function create_render_context(
    opponent_mode: GameOptions['multiplayer']['seeOpponents'],
    overrides: Partial<GameOptions> = {},
) {
    const opts: GameOptions = {
        ...CLASSIC_OPTS,
        ...overrides,
        grid: {
            ...CLASSIC_OPTS.grid,
            ...(overrides.grid ?? {}),
        },
        scoring: {
            ...CLASSIC_OPTS.scoring,
            ...(overrides.scoring ?? {}),
        },
        multiplayer: {
            ...CLASSIC_OPTS.multiplayer,
            ...(overrides.multiplayer ?? {}),
            seeOpponents: opponent_mode,
        },
    };
    const store = new Store();
    const game = new ActiveGame('lobby-1', opts, ['p1', 'p2']);
    const self = new PlayerInGame(new Board(10, 20), 'p1');
    const opponent = new PlayerInGame(new Board(10, 20), 'p2');
    const self_user = new Player('p1', 'alice', playerStatusType.playing, 'sid-1', 'sock-1', 'now', 'csrf-1');
    const opponent_user = new Player('p2', 'bob', playerStatusType.playing, 'sid-2', 'sock-2', 'now', 'csrf-2');

    self.get_board().set_current_piece(new Piece('T', 3, 0));
    opponent.get_board().set_board(mark_bottom_cell(opponent.get_board().get_board()));
    opponent.get_board().set_current_piece(new Piece('O', 4, 0));
    expect(game.add_player('p1', self).success).toBe(true);
    expect(game.add_player('p2', opponent).success).toBe(true);
    expect(store.get_player_store().add_player(self_user).success).toBe(true);
    expect(store.get_player_store().add_player(opponent_user).success).toBe(true);

    return {
        game,
        store,
        opponent_user,
    };
}

function mark_bottom_cell(board: BoardType): BoardType {
    const next = board.map((row) => [...row]);
    next[next.length - 1][0] = 'I';
    return next;
}
