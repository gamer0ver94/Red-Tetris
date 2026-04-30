import { Game } from '../models/game_model.ts'
import { gameStatusType } from '../types/status_types.js';


//class use to keep memory of all running games

export class GameStore{

    private id_to_game_map: Map<string, Game>;
    private game_id_to_ids_map: Map<string, Set<string>>;
    private player_id_to_game_id_map: Map<string, string>;

    constructor(){
        this.id_to_game_map = new Map<string, Game>();
        this.game_id_to_ids_map = new Map<string, Set<string>>();
        this.player_id_to_game_id_map = new Map<string, string>();
    }

    //Getters
    public async get_all_multiplayer_waiting(): Promise<Set<Game>>{
        
        const open_games = new Set<Game>;
        for(const game of this.id_to_game_map.values()){
            if (game.get_game_status() === gameStatusType.waiting && game.get_game_type() === 'multi_player')
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

    public async get_game_by_player_id(player_id:string): Promise<Game | undefined>{
        return await this.get_game_by_id(this.player_id_to_game_id_map.get(player_id)!);
    }

    //Methods
    public async add_player_by_id(player_id: string, game: Game): Promise<string>{
        
        const ids = await this.get_all_ids();
        if (ids.has(player_id))
            return "You are already in a game";

        this.player_id_to_game_id_map.set(player_id, game.get_game_id());

        //GAME WAS JUST CREATED
        if(await this.get_game_by_id(game.get_game_id()) == undefined){
            this.id_to_game_map.set(game.get_game_id(), game);
            const ids = new Set<string>();
            ids.add(player_id)
            this.game_id_to_ids_map.set(game.get_game_id(), ids);
            return "success";
        }
        
        //USER JUST JOIN 
        this.id_to_game_map.get(game.get_game_id())?.add_player(player_id);
        this.game_id_to_ids_map.get(game.get_game_id())!.add(player_id);
        return "success";
    }

    public async remove_player_by_id(player_id:string, game_id:string): Promise<string>{
        
        const game = await this.get_game_by_id(game_id);

        if(!game)
            return "game not found";

        game.remove_player(player_id);
        game.remove_board(player_id);
        game.remove_player_to_piece(player_id);
        this.game_id_to_ids_map.get(game.get_game_id())!.delete(player_id);
        this.player_id_to_game_id_map.delete(player_id);

        if (game.get_player_ids()!.size === 0){
            this.game_id_to_ids_map.get(game.get_game_id())!.clear();
            this.id_to_game_map.delete(game_id);
            return "game deleted";
        }

        return "success";
    }
}