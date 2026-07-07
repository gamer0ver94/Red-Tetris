import { describe, expect, it } from 'vitest';

import { Lobby } from '../../../models/lobby_model.js';
import { Player } from '../../../models/player_model.js';
import { Store } from '../../../stores/store.js';
import { setup_active_game } from '../../../services/game_setup_services.js';
import { CLASSIC_OPTS } from '../../../types/pre_made_options.js';
import { gameStatusType, playerStatusType } from '../../../types/status_types.js';

describe('services: game_setup_services', () => {
    it('creates an active game with boards and initial pieces for lobby players', () => {
        const { store, lobby } = create_lobby_with_players(['p1', 'p2']);

        const result = setup_active_game(lobby, store);

        expect(result).toEqual({ success: true, data: null });
        const active_res = store.get_active_game_store().get_active_game_by_lobby_id(lobby.get_lobby_id());
        expect(active_res.success).toBe(true);
        if (!active_res.success)
            throw new Error('Expected active game');

        for (const player_id of lobby.get_player_ids()) {
            const player_res = active_res.data.get_player(player_id);
            expect(player_res.success).toBe(true);
            if (!player_res.success)
                throw new Error('Expected player in active game');
            expect(player_res.data.get_board().get_current_piece()).not.toBeNull();
        }
    });

    it('returns active game store errors when active game already exists', () => {
        const { store, lobby } = create_lobby_with_players(['p1']);

        expect(setup_active_game(lobby, store).success).toBe(true);

        expect(setup_active_game(lobby, store)).toEqual({
            success: false,
            code: 'ACTIVE_GAME_EXIST',
        });
    });

    it('returns add-player failures with the triggering player id', () => {
        const { lobby } = create_lobby_with_players(['p1']);
        const failing_store = {
            get_active_game_store: () => ({
                add_active_game: () => ({ success: true, data: null }),
                add_player_to_active_game: () => ({ success: false, code: 'PLAYER_IN_ACTIVE_GAME' }),
            }),
        } as unknown as Store;

        expect(setup_active_game(lobby, failing_store)).toEqual({
            success: false,
            code: 'PLAYER_IN_ACTIVE_GAME',
            details: { trigger_id: 'p1' },
        });
    });

    it('returns board creation failures with the triggering player id', () => {
        const store = new Store();
        let get_player_ids_calls = 0;
        const inconsistent_lobby = {
            get_lobby_id: () => 'lobby-1',
            get_game_opts: () => CLASSIC_OPTS,
            get_player_ids: () => {
                get_player_ids_calls += 1;
                return get_player_ids_calls === 1 ? ['p1'] : [];
            },
        } as unknown as Lobby;

        expect(setup_active_game(inconsistent_lobby, store)).toEqual({
            success: false,
            code: 'PLAYER_NOT_FOUND',
            details: { trigger_id: 'p1' },
        });
    });

    it('returns piece creation failures with the triggering player id', () => {
        const { store, lobby } = create_lobby_with_players(['p1'], {
            ...CLASSIC_OPTS,
            grid: {
                ...CLASSIC_OPTS.grid,
                width: 1,
                height: 1,
            },
        });

        expect(setup_active_game(lobby, store)).toEqual({
            success: false,
            code: 'PIECE_CANNOT_SPAWN',
            details: { trigger_id: 'p1' },
        });
    });
});

function create_lobby_with_players(
    player_ids: string[],
    opts = CLASSIC_OPTS,
): { store: Store; lobby: Lobby } {
    const store = new Store();
    const lobby = new Lobby('lobby-1', player_ids[0], opts, 'classic');
    lobby.set_game_status(gameStatusType.waiting);
    expect(store.get_lobby_store().add_lobby(lobby).success).toBe(true);

    for (const player_id of player_ids) {
        const player = new Player(
            player_id,
            `user-${player_id}`,
            playerStatusType.waiting,
            `sid-${player_id}`,
            `socket-${player_id}`,
            'now',
            `csrf-${player_id}`,
        );
        expect(store.get_player_store().add_player(player).success).toBe(true);
        expect(store.get_lobby_store().add_player_to_lobby(player_id, lobby.get_lobby_id()).success).toBe(true);
    }

    return { store, lobby };
}
