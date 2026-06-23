import { EndGameCondition, EndGamePlayerState, EndGameResult } from "../types/game_types.js";


export function evaluate_end_game(
    players:EndGamePlayerState[],
    condition:EndGameCondition,
    limit:number|null,
    now?:number,
    start_time?:number
):EndGameResult{

    let res:EndGameResult = {finished: false};
    if(players.every((player) => !player.alive))
        return all_dead(players);
    switch(condition){
        case'first_lost':
            res = evaluate_first_lost(players);
            break;
        case 'survival':
            res = evaluate_survival(players);
            break;
        case 'lines':
            res = evaluate_lines(players, limit);
            break;
        case 'score':
            res = evaluate_score(players, limit);
            break;
        case 'time':
            res = evaluate_time(players, limit, now, start_time);
            break;
    }
    return res;
}

function get_highest_score(players:EndGamePlayerState[]):number{
    let highest = 0;

    for (const player of players){
        const score = player.score;
        if(score > highest)
            highest = score;
    }

    return highest;  
}

function all_dead(players:EndGamePlayerState[]):EndGameResult{
    if(players.length === 1){
        return {
            finished:true,
            winners_id:[],
            losers_id:players.map((player) => player.player_id),
        };
    }

    const highest = get_highest_score(players);
    const winners_id:string[] = players
        .filter((player) => player.score >= highest)
        .map((player) => player.player_id);
    const losers_id:string[] = players
        .filter((player) => !winners_id.includes(player.player_id))
        .map((player) => player.player_id);

    return {finished:true, winners_id, losers_id};
}

function evaluate_first_lost(
    players:EndGamePlayerState[]
):EndGameResult{

    const losers_id:string[] = players
        .filter((player) => ! player.alive)
        .map((player) => player.player_id);
    
    if(losers_id.length === 0)
        return {finished:false}
    
    const winners_id:string[] = players
        .filter((player) => player.alive)
        .map((player) => player.player_id);
    return {finished:true, winners_id, losers_id};

}

function evaluate_survival(
    players:EndGamePlayerState[]
):EndGameResult{
    
    const losers_id:string[] = players
    .filter((player) => !player.alive)
    .map((player) => player.player_id);

    if(losers_id.length < players.length - 1 || players.length == 1)
        return {finished:false};

    const winners_id:string[] = players
    .filter((player) => player.alive)
    .map((player) => player.player_id);

    return {finished:true, winners_id, losers_id};
}

function evaluate_lines(
    players:EndGamePlayerState[],
    limit:number|null,
):EndGameResult{
    const candidates:EndGamePlayerState[] = players
        .filter((player) => player.lines >= (limit ?? Infinity))
        .map((player) => player);
    
    if(candidates.length === 0)
        return {finished:false};
    
    const highest = get_highest_score(candidates);
    const winners_id:string[] = candidates
        .filter((player) => player.score >= highest)
        .map((player) => player.player_id);

    const losers_id:string[] = players
        .filter((player) => !winners_id.includes(player.player_id))
        .map((player) => player.player_id);
    return {finished:true, winners_id, losers_id};
}

function evaluate_score(
    players:EndGamePlayerState[],
    limit:number|null,
):EndGameResult{
    const highest = get_highest_score(players);
    
    if(highest < (limit ?? Infinity))
        return {finished:false};
    
    const winners_id:string[] = players
        .filter((player) => player.score >= highest)
        .map((player) => player.player_id);

    const losers_id:string[] = players
        .filter((player) => player.score < highest)
        .map((player) => player.player_id);
    return {finished:true, winners_id, losers_id};
}

function evaluate_time(
    players:EndGamePlayerState[],
    limit:number|null,
    now?:number,
    start_time?:number
):EndGameResult{
    if(
        now === undefined
        || start_time === undefined
        || now < start_time+(limit ?? Infinity)
    )
            return {finished:false};
    const highest = get_highest_score(players);
    const winners_id:string[] = players
        .filter((player) => player.score >= highest)
        .map((player) => player.player_id);
    const losers_id:string[] = players
        .filter((player) => player.score < highest)
        .map((player) => player.player_id);
    return {finished:true, winners_id, losers_id};
}
