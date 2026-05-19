import { GameOptions } from "./game_options_types.ts";

export const CLASSIC_OPTS:GameOptions = {
    grid:{
        width: 10 ,
        height: 20,
    },
    pieces:{
        randomSequence:true,
        sharedSequence:true,
        allowHold:false,
        nextPreviewCount:3,
    },
    gravity:{
        tickMs: 800,
        lockDelayMs:100,
        softDropMultiplier:0.3,
        fallAfterClear:false
    },
    garbage:{
        enabled:true,
        ratio:1,
        canClear:false,
        clearCreateGarbage:false,

    },
    scoring:{
        enabled:false,
        comboBonus:false,
        backToBackBonus:false,
    },
    win:{
        condition:'survival',
        limit:null,
    },
    multiplayer:{
        enabled:true,
        maxPlayers:null,
        seeOpponents:'highest',
    }
}

export const HARD_OPTS:GameOptions = {
    grid:{
        width: 20,
        height: 30,
    },
    pieces:{
        randomSequence:true,
        sharedSequence:false,
        allowHold:true,
        nextPreviewCount:0,
        invisiblePiece:true,
    },
    gravity:{
        tickMs:600,
        speedIncrease:true,
        lockDelayMs:50,
        softDropMultiplier:0.4,
    },
    garbage:{
        enabled:true,
        initialRows:1,
        garbagePerClear:true,
    },
    scoring:{
        enabled:true,
        comboBonus:true,
        backToBackBonus:true,
    },
    win:{
        condition:'score',
        limit:2000,
    },
    multiplayer:{
        enabled: true,
        maxPlayers:null,
        seeOpponents: 'grid',
    }
}

export const EASY_OPTS:GameOptions={
    grid:{
        width:10,
        height:20,
    },
    pieces:{
        randomSequence:false,
        sharedSequence:true,
        allowHold:true,
        nextPreviewCount:7,
        invisiblePiece:false,
    },
    gravity:{
        tickMs:900,
        speedIncrease:false,
        lockDelayMs:150,
        softDropMultiplier:0.3,
    },
    garbage:{
        enabled:false,
        initialRows:0,
        garbagePerClear:false,
    },
    scoring:{
        enabled:false,
        comboBonus:false,
        backToBackBonus:false,
    },
    win:{
        condition:'first_lost',
        limit:null,
    },
    multiplayer:{
        enabled:true,
        maxPlayers:2,
        seeOpponents:'full',
    }
}

export const SOLO_OPTS:GameOptions={
    grid:{
        width:10,
        height:20,
        invisible:false,
        revealOnClearMs:0,
    },
    pieces:{
        randomSequence:true,
        sharedSequence:false,
        allowHold:true,
        nextPreviewCount:4,
    },
    gravity:{
        tickMs:800,
        lockDelayMs:100,
        softDropMultiplier:0.3,
        fallAfterClear:true,
    },
    garbage:{
        enabled:false,
        canClear:false,
        ratio:0,
        clearCreateGarbage:false,
    },
    scoring:{
        enabled:true,
        comboBonus:true,
        backToBackBonus:true,
    },
    win:{
        condition:'survival',
        limit:null,
    },
    multiplayer:{
        enabled:false,
        maxPlayers:1,
        seeOpponents:'none',
    }
}

export const BATTLE_OPTS:GameOptions = {
    grid:{
        width:20,
        height: 30,
    },
    pieces:{
        randomSequence:true,
        sharedSequence:false,
        allowHold:true,
        nextPreviewCount:3,
        invisiblePiece:true,
    },
    gravity:{
        tickMs:800,
        speedIncrease:true,
        lockDelayMs:100,
        softDropMultiplier:0.3,
    },
    garbage:{
        enabled:true,
        ratio:1,
        garbagePerClear:true,
    },
    scoring:{
        enabled:true,
        comboBonus:true,
        backToBackBonus:true,
    },
    win:{
        condition:'survival',
        limit:null,
    },
    multiplayer:{
        enabled:true,
        maxPlayers:10,
        seeOpponents:'full',
    }
}

export const MAPPED_OPTS = {
    classic: CLASSIC_OPTS,
    hard: HARD_OPTS,
    easy: EASY_OPTS,
    solo: SOLO_OPTS,
    battle: BATTLE_OPTS,
    custom: undefined,
} as const;

export type GameMode = keyof typeof MAPPED_OPTS;