
const SCORE_TABLE = {
    'single':100,
    'double':300,
    'triple': 500,
    'tetris': 800,
    'garbage':50,
} as const;

export function resolve_count(count:number){
    switch(count){
        case 1:
            return 'single';
        case 2:
            return 'double';
        case 3: 
            return 'triple';
        default:
            return 'tetris';
    }
}

export function score_line_clear(score: number, count: number, bonus = 1): number{
    if(count <= 0)
        return score;

    const new_score = score + (SCORE_TABLE[resolve_count(count)] * bonus);
    return new_score;
}

export function score_garbage_clear(score: number, count: number, bonus = 1): number{
    const new_score = score + (count * SCORE_TABLE['garbage']) * bonus;
    return new_score;
}

export function score_garbage_spawn(score: number, count: number): number{
    const new_score = score - (count * SCORE_TABLE['garbage']);
    return new_score;
}
