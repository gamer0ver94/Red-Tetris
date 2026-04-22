import { Player } from "../models/player_model.ts";
import { Game } from "../models/game_model.ts";
import { PlayerStore } from "./players_store.ts";
import { GameStore } from "./games_store.ts";


export class Store{

    private game: GameStore;
    private players: PlayerStore;

    constructor(game:GameStore, players:PlayerStore){
        this.game = game;
        this.players = players;
    }

    public get_game_store() {
        return this.game
    }

    public get_player_store(){
        return this.players
    }

    public async get_all_sid_by_game_id(game_id:string){
        
        const game = await this.game.get_game_by_id(game_id)
        const ids = game!.get_player_ids();
        const sids = new Set<string>();
        for (const id of ids){
            const player = await this.players.get_player_by_id(id)
            if(player)
                sids.add(player.get_sid());
        }
        return sids
    }

    public async get_all_sockets_by_game_id(game_id:string){

        const game = await this.game.get_game_by_id(game_id);
        const ids = game!.get_player_ids();
        const socket_ids = new Set<string>;
        for(const id of ids){
            const player = await this.players.get_player_by_id(id);
            if (player)
                socket_ids.add(player.get_socket());
        }
        return socket_ids;
    }
}