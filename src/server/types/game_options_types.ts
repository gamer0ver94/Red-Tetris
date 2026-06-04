import { EndGameCondtion } from "./game_types.js";

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
        maxLock:number;
        softDropMultiplier:number;
        fallAfterClear:boolean;
        speedOnClear:boolean;
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
        condition:EndGameCondtion;
        limit:number|null;
    },

    multiplayer:{
        enabled:boolean;
        maxPlayers:number|null;
        seeOpponents:'full'| 'grid'| 'highest' | 'none';
    },
}


