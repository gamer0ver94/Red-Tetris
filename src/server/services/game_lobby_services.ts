import { Game } from '../models/game_model.ts'
import { Player } from '../models/player_model.ts'
import { GameStore } from '../stores/games_store.ts'
import { PlayerStore } from '../stores/players_store.ts'
import { Store } from '../stores/store.ts'
import { find_me } from './auth_services.ts'


import {randomBytes} from 'node:crypto'




const MAX_MULTIPLAYER_COUNT=2

export async function join_game(
    sid:string,
    game_id:string,
    store:Store,
){
    const player = await store.get_player_store().get_player_by_sid(sid);
    if(!player || player === undefined)
        return {success:false, reason: "player not found"}

    const game = await store.get_game_store().get_game_by_id(game_id);
    if (!game || game.get_game_type() !== 'multi_player')
        return {success:false, reason: "game not found"};

    const ids = game.get_player_ids();
    if(ids!.size >= MAX_MULTIPLAYER_COUNT)
        return {success:false, reason:"the match is full"};

    
    if (ids?.has(player.get_player_id()))
        return {success:false, reason:"you can't join a game you are in"};

    await store.get_game_store().add_player_by_id(player.get_player_id(), game);
    
    const username = player.get_username();
    const socket_ids = await store.get_all_sockets_by_game_id(game.get_game_id());

    return { success:true, username, socket_ids }
}

export async function start_game(sid:string, store:Store){
    
    const player = await store.get_player_store().get_player_by_sid(sid);
    if(!player)
        return {success:false, reason:'player not found'};

    const game = await store.get_game_store().get_game_by_player_id(player.get_player_id());
    if(!game)
        return {success:false, reason:'game not found'};

    //
    if(game.get_owner_id() !== player.get_player_id())
        return {success:false, reason:`you can't start this game`};

    //Extract  by game_id   
    const game_response = {game_id:game.get_game_id() ,type:game.get_game_type(), mode:game.get_game_mode(), status:'started'};
    
    const socket_ids = await store.get_all_sockets_by_game_id(game.get_game_id());
    
    const sids = await store.get_all_sid_by_game_id(game.get_game_id());
    // IDEALY I WANT REPLY SUCH AS {game_response: {id, type, ..,...} ids{1:id_1, 2:id_2 ...}
    return {success:true, game_response, socket_ids, sids}    
}

export async function create_game(
    store:Store,
    user_sid: string,
    game_type: 'single_player' | 'multi_player',
    game_mode: string,
){
    const player_data = await find_me(user_sid, store.get_player_store());
    const owner_id = player_data.player_id!;

    const game_id = await generate_unique_game_id(store.get_game_store());
    const game = new Game(
        game_id,
        owner_id,
        game_type,
        game_mode
    );

    const response = await store.get_game_store().add_player_by_id(owner_id, game);

    if (response !== 'success')
        return {success: false, reason: response}

    return {
        success:true,
        game_id: game_id,
    }

}

export async function leave_game(
    sid:string,
    store:Store
){
    //Checks the status of the game

    const player = await store.get_player_store().get_player_by_sid(sid);
    if(!player)
        return{success:false, reason: "player not found"};
    const game = await store.get_game_store().get_game_by_player_id(player.get_player_id());
    if (!game)
        return {success:false, reason: "game not found"};
    switch(game.get_game_status()){
        // case 'playing':
        //     break;
        case 'waiting':
            const res = await leave_game_waiting(player, game, store);
            return {success:true, res};
        // case 'finish':
        //     break;
        default:
            return {success:false, reason: "unknown game status"};
    }
}

async function leave_game_waiting(player:Player, game:Game, store:Store){
    
    let was_owner = false;

    if(player.get_player_id() === game.get_owner_id())
        was_owner = true;

    //leave game first
    const res = await store.get_game_store().remove_player_by_id(
        player.get_player_id(),
        game.get_game_id()
    );
    if (res === "game deleted")
        return {success:true, deleted:true};

    const socket_ids = await store.get_all_sockets_by_game_id(game.get_game_id());

    if(! was_owner){
        return {
            success:true,
            deleted:false,
            new_owner:false,
            leaver_name:player.get_username(),

            socket_ids
        }
    }
    const new_owner_id = game.get_player_ids().values().next().value;
    game.set_owner(new_owner_id!);
    const owner = await store.get_player_store().get_player_by_id(new_owner_id!);
    return {
        success:true,
        deleted:false,
        new_owner:true,
        new_owner_socket:owner!.get_socket(),
        leaver_name:player.get_username(),
        socket_ids,
    };
}


async function generate_unique_game_id(game_store: GameStore) : Promise<string>{
    while (true){
        const id = randomBytes(6).toString();
        if (await game_store.get_game_by_id(id) == undefined)
            return id;
    }

}
