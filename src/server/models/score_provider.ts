
type ScoreName = 
| 'single'
| 'double'
| 'triple'
| 'tetris';

export class ScoreProvider{

    private static score_table: Record<ScoreName, number> = {
        'single': 100,
        'double': 300,
        'triple': 500,
        'tetris': 800,
    };

    private static garbage = 50;

    public static line_clear(score:number, count:number, bonus:number = 1){
        if (count <= 0)
            return score;
        return score + (this.score_table[this.resolve_lines(count)] * bonus)
    }

    public static garbage_clear(score:number, count:number, bonus:number = 1){
        return score + (count * this.garbage) * bonus;
    }

    public static garbage_spawn(score:number, count:number){
        return score - (count * this.garbage);
    }

    private static resolve_lines(count:number):ScoreName{
        if(count == 1)
            return 'single';
        if(count == 2)
            return 'double';
        if(count == 3)
            return 'triple';
        return 'tetris';
    }
}