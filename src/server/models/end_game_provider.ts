import { EndGameCondition } from "../types/game_types.js";
import { ActiveGame } from "./active_game_model.js";
import { PlayerInGame } from "./player_in_game_model.js";


export type EndGameResult = 
| {
    finished:false;
}
| {
    finished:true;
    winners_id?:string[];
    losers_id?:string[];
}


export class EndGameProvider {

    
    public static evaluateEndGame(active_game:ActiveGame, condition:EndGameCondition, limit:number | null):EndGameResult{

        if(condition === 'first_lost')
            return this.evaluate_first_lost(active_game);

        if(condition === 'lines')
            return this.evaluate_lines(active_game, limit);

        if (condition === 'score')
            return this.evaluate_score(active_game, limit);

        if (condition === 'time')
            return this.evaluate_time(active_game, limit);

        if (condition === 'survival')
            return this.evaluate_survival(active_game);

        return {finished:false};
    }

    private static evaluate_first_lost(active_game:ActiveGame):EndGameResult{
        const players = active_game.get_players();
        const losers_id:string[] = players.filter((player) => !player.is_alive()).map((player) => player.get_player_id());
        if(losers_id.length === 0)
            return {finished:false};

        const winners_id:string[] = players.filter((player) => player.is_alive()).map((player) => player.get_player_id());
        return {finished:true, winners_id, losers_id};
    }

    private static evaluate_lines(active_game:ActiveGame, limit:number | null):EndGameResult{
        const players = active_game.get_players();
        const candidates:PlayerInGame[] = players.filter((player) => player.get_lines() >= (limit ?? Infinity)).map((player) => player);
        if(candidates.length === 0)
            return {finished:false};
        
        const highest = this.get_highest_score(candidates);
        const winners_id:string[] = candidates.filter((player) => player.get_score() >= highest).map((player) => player.get_player_id())
        const losers_id:string[] = players.filter((player) => ! winners_id.includes(player.get_player_id()) ).map((player) => player.get_player_id());
        return {finished:true, winners_id, losers_id};
    }

    private static evaluate_score(active_game:ActiveGame, limit:number|null):EndGameResult{
        const players = active_game.get_players();

        const highest = this.get_highest_score(active_game.get_players());
        
        if(highest < (limit ?? Infinity))
            return {finished:false};
        
        const winners_id:string[] = players.filter((player) => player.get_score() >= highest).map((player) => player.get_player_id());
        const losers_id:string[] = players.filter((player) => player.get_score() < highest).map((player) => player.get_player_id());
        return {finished:true, winners_id, losers_id};
    }

    private static evaluate_time(active_game:ActiveGame, limit:number|null):EndGameResult{

        const now = Date.now();

        const start_time = active_game.get_start_time();

        if(now < start_time+(limit ?? Infinity))
            return {finished:false};

        return this.evaluate_score(active_game, this.get_highest_score(active_game.get_players()));
    }

    private static evaluate_survival(active_game:ActiveGame){

        const players = active_game.get_players();

        const losers_id:string[] = players.filter((player) => !player.is_alive()).map((player) => player.get_player_id());
        if(losers_id.length < players.length - 1)
            return {finished:false};
        const winners_id:string[] = players.filter((player) => player.is_alive()).map((player) => player.get_player_id());

        return {finished:true, winners_id, losers_id};
    }

    private static get_highest_score(players:PlayerInGame[]):number{

        let highest = 0;

        for (const player of players){
            const score = player.get_score();
            if(score > highest)
                highest = score;
        }

        return highest;
    }
}