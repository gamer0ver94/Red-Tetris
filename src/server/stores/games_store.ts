import { Game } from '../models/game_model.ts'
import { Player } from './players_store.ts';

//class use to keep memory of all running games

export class GameStore{

    private id_to_game_map: Map<string, Game>;

    constructor(){
        this.id_to_game_map = new Map<string, Game>();
    }

    //Getters
    public async get_all_multiplayer_waiting(): Promise<Set<Game>>{
        
        const open_games = new Set<Game>;
        for(const game of this.id_to_game_map.values()){
            if (game.get_game_status() === 'waiting' && game.get_game_type() === 'multiplayer')
                open_games.add(game);
        }
        return open_games;
    }

    public async get_all_ids(): Promise<Set<string>>{

        const ids = new Set<string>;
        for( const game of this.id_to_game_map.values()){
            for( const id of game.get_player_ids())
                ids.add(id);
        }
        return ids;
    }

    public async get_game_by_id(game_id:string): Promise<Game|undefined>{
        if(this.id_to_game_map.has(game_id)){
            const game = this.id_to_game_map.get(game_id);
            if(!game)
                return undefined;
            return game;
        }
        return undefined;
    }

    //Methods
    public async add_player_by_id(player_id: string, game: Game): Promise<string>{
        
        const ids = await this.get_all_ids();
        if (ids.has(player_id))
            return "You are already in a game";

        //GAME WAS JUST CREATED
        if(await this.get_game_by_id(game.get_game_id()) == undefined){
            this.id_to_game_map.set(game.get_game_id(), game)
            return "success"
        }
        
        //USER JUST JOIN 
        this.id_to_game_map.get(game.get_game_id())?.add_player(player_id);
        return "success"
    }

    public async remove_player_by_id(player_id:string, game_id:string): Promise<string>{
        
        const game = await this.get_game_by_id(game_id);

        if(!game)
            return "game not found"

        game.remove_player(player_id)
        return "success"
    }

    public async remove_game_by_id(game_id:string): Promise<string>{

        const game = this.get_game_by_id(game_id);
        if(!game)
            return "game not found";
        this.id_to_game_map.delete(game_id);
        return "success";
    }
}