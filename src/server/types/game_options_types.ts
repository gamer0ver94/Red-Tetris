export type GameOptions = {

    grid:{
        width:number;
        height:number;
    },

    pieces:{
        randomSequence:boolean;
        sharedSequence:boolean;
        allowHold:boolean;
        nextPreviewCount:number;
        invisiblePiece:boolean;
    },

    gravity:{
        tickMs:number,
        speedIncrease:boolean;
        lockDelayMs:number;
        softDropMultiplier:number;
    },

    garbage:{
        enabled:boolean;
        initialRows:number;
        garbagePerClear:boolean;
    },

    scoring:{
        enabled:boolean;
        comboBonus:boolean;
        backToBackBonus:boolean;
    },

    win:{
        condition:'survival'|'first_lost'|'score'|'lines'|'time';
        limit:number|null;
    },

    multiplayer:{
        enabled:boolean;
        maxPlayers:number|null;
        seeOpponents:'full'| 'grid'| 'highest' | 'none';
    },
}


