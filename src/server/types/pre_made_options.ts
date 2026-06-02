import { GameOptions } from "./game_options_types.ts";

export const CLASSIC_OPTS:GameOptions = {
    grid:{
        width: 10 ,
        height: 20,
        invisible:false,
        revealOnClearMs:0
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
        condition:'first_lost',
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
        invisible:true,
        revealOnClearMs:100,
    },
    pieces:{
        randomSequence:true,
        sharedSequence:false,
        allowHold:false,
        nextPreviewCount:1,
    },
    gravity:{
        tickMs:600,
        lockDelayMs:50,
        softDropMultiplier:0.4,
        fallAfterClear:false,
    },
    garbage:{
        enabled:true,
        ratio:1,
        canClear:false,
        clearCreateGarbage:false,
    },
    scoring:{
        enabled:true,
        comboBonus:true,
        backToBackBonus:true,
    },
    win:{
        condition:'first_lost',
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
        invisible:false,
        revealOnClearMs:0,
    },
    pieces:{
        randomSequence:false,
        sharedSequence:true,
        allowHold:true,
        nextPreviewCount:7,
    },
    gravity:{
        tickMs:900,
        lockDelayMs:150,
        softDropMultiplier:0.3,
        fallAfterClear:true,
    },
    garbage:{
        enabled:true,
        ratio:0,
        canClear:true,
        clearCreateGarbage:true,
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
        invisible:false,
        revealOnClearMs:0,
    },
    pieces:{
        randomSequence:true,
        sharedSequence:false,
        allowHold:true,
        nextPreviewCount:3,
    },
    gravity:{
        tickMs:800,
        lockDelayMs:100,
        softDropMultiplier:0.3,
        fallAfterClear:true,
    },
    garbage:{
        enabled:true,
        ratio:1,
        canClear:true,
        clearCreateGarbage:true,
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