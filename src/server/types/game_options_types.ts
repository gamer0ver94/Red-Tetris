export type GameOptions = {

    grid:{
        width:number;
        height:number;
        invisible:boolean;
        revealOnClearMs:number;
    },

    pieces:{
        randomSequence:boolean;
        sharedSequence:boolean;
        allowHold:boolean;
        nextPreviewCount:number;
    },

    gravity:{
        tickMs:number,
        lockDelayMs:number;
        softDropMultiplier:number;
        fallAfterClear:boolean;
    },

    garbage:{
        enabled:boolean;
        canClear:boolean;
        ratio:number; // 0 -> each lines makes garbage, 1 -> 1+ lines clears ....
        clearCreateGarbage:boolean;//clear garbage send garbage back ?
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


