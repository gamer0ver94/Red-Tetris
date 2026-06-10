import { EndGameCondtion } from "./game_types.js";

export type GameOptions = {

    grid:{
        // Playfield width in cells.
        width:number;
        // Playfield height in cells.
        height:number;
        // Hide settled blocks from the player until a reveal event.
        invisible:boolean;
        // Time in milliseconds to briefly reveal invisible blocks after a clear.
        revealOnClearMs:number;
    },

    pieces:{
        // Generate pieces randomly instead of using a deterministic sequence.
        randomSequence:boolean;
        // Give every player the same piece sequence in multiplayer.
        sharedSequence:boolean;
        // Allow players to store and swap one held piece.
        allowHold:boolean;
        // Number of upcoming pieces shown to the player.
        nextPreviewCount:number;
    },

    gravity:{
        // Base fall interval in milliseconds for automatic gravity ticks.
        tickMs:number,
        // Grace period in milliseconds before a grounded piece locks.
        lockDelayMs:number;
        // Maximum number of lock-delay resets allowed before forced lock.
        maxLock:number;
        // Gravity multiplier applied while soft drop is pressed.
        softDropMultiplier:number;
        // Drop floating blocks after line clears.
        fallAfterClear:boolean;
        // Increase game speed based on total piece locks.
        speedOnLock:boolean;
    },

    garbage:{
        // Enable garbage line mechanics.
        enabled:boolean;
        // Allow players to clear garbage lines from their own board.
        canClear:boolean;
        // Conversion ratio from cleared lines to garbage sent.
        // 0 means every cleared line can create garbage; higher values require more clears.
        ratio:number;
        // Clearing garbage can send garbage back to opponents.
        clearCreateGarbage:boolean;
    },

    scoring:{
        // Enable score calculation and score-based history visibility.
        enabled:boolean;
        // Award extra points for consecutive difficult clears.
        backToBackBonus:boolean;
    },

    win:{
        // Rule used by EndGameProvider to decide when the match finishes.
        condition:EndGameCondtion;
        // Numeric threshold for limited win conditions; null means no explicit limit.
        limit:number|null;
    },

    multiplayer:{
        // Enable multiplayer behavior such as opponents and garbage.
        enabled:boolean;
        // Maximum allowed players in the lobby; null means no configured cap.
        maxPlayers:number|null;
        // Amount of opponent board information visible to each player.
        seeOpponents:'full'| 'grid'| 'highest' | 'none';
    },
}

