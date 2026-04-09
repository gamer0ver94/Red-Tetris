import { Game } from '../models/game_model.ts'
import { GameStore } from '../stores/games_store.ts'
import { find_me } from './auth_services.ts'
import { PlayerStore } from '../stores/players_store.ts'
import {randomBytes} from 'node:crypto'
import type {FastifyRequest} from 'fastify'
import * as helpers from '../sockets/misc_sockets.ts'



const MAX_MULTIPLAYER_COUNT=2

export async function join_game(
    player_data,
    game_id:string,
    game_store:GameStore,
){
    const game = await game_store.get_game_by_id(game_id);
    if (!game || game.get_game_type() !== 'multiplayer')
        return {success:false, reason:"game not found"};

    const ids = game?.get_player_ids();
    if(ids!.size >= MAX_MULTIPLAYER_COUNT)
        return {success:false, reason:"the match is full"};
    if (ids?.has(player_data.player_id!))
        return {success:false, reason:"you can't join a game you are in"};

    game_store.add_player_by_id(player_data.player_id!, game!);
    return { success:true }
}



export async function create_game(
    game_store: GameStore,
    player_store: PlayerStore,
    user_sid: string,
    game_type: 'single_player' | 'multi_player',
    game_mode: string,
){
    const player_data = await find_me(user_sid, player_store);
    const owner_id = player_data.player_id!;

    const game_id = await generate_unique_game_id(game_store);
    const game = new Game(
        game_id,
        owner_id,
        game_type,
        game_mode
    );

    const response = await game_store.add_player_by_id(owner_id, game);

    if (response !== 'success')
        return {success: false, reason: response}

    return {
        success:true,
        game_id: game_id,
    }

}

async function generate_unique_game_id(game_store: GameStore) : Promise<string>{
    while (true){
        const id = randomBytes(6).toString();
        if (await game_store.get_game_by_id(id) == undefined)
            return id;
    }

}