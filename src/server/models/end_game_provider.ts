import { EndGameCondition } from "../types/game_types.js";
import { ActiveGame } from "./active_game_model.js";


export type EndGameResult = 
| {
    finished:false;
}
| {
    finished:true;
    winners_id:string[];
    losers_id:string[];
}


export class EndGameProvider {

    
    public static evaluateEndGame(active_game:ActiveGame, condition:EndGameCondition, limit:number | null):EndGameResult{

        if(condition === 'first_lost')
            return this.evaluate_first_lost(active_game);

        if(condition === 'lines')
            return this.evaluate_lines(active_game, limit);

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
        const winners_id:string[] = players.filter((player) => player.get_lines() >= (limit ?? Infinity)).map((player) => player.get_player_id());
        if(winners_id.length === 0)
            return {finished:false};
        
        const losers_id:string[] = players.filter((player) => player.get_lines() < (limit ?? Infinity)).map((player) => player.get_player_id());
        return {finished:true, winners_id, losers_id};
    }
}