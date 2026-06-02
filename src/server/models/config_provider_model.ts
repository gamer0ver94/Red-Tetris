import { GameOptions } from "../types/game_options_types.js";

export class ConfigProvider{

    private opts:GameOptions

    constructor(opts:GameOptions){
        this.opts = opts;
    }
    
    public can_hold():boolean {
        return this.opts.pieces.allowHold;
    }

    public get_line_clear_mode(): 'classic' | 'cell_gravity'{
        if(this.opts.gravity.fallAfterClear)
            return 'cell_gravity';
        return 'classic';
    }

    public get_reveal_on_clear_ms():number{
        return this.opts.grid.revealOnClearMs;
    }

    public get_fall_interval_ms(drop:{soft:boolean, hard:boolean}):number{

        if(drop.hard)
            return 0;
        if(drop.soft)
            return this.opts.gravity.tickMs * (1 + this.opts.gravity.softDropMultiplier);
        return this.opts.gravity.tickMs;
    }

    public get_boundaries():{width:number, height:number}{

        const width = this.opts.grid.width;
        const height = this.opts.grid.height;
        return {width, height};
    }

    public is_invisible():boolean{
        return this.opts.grid.invisible;
    }

    public is_random_sequence():boolean{
        return this.opts.pieces.randomSequence;
    }

    public is_shared_sequence():boolean{
        return this.opts.pieces.sharedSequence;
    }

    public get_drop_multiplier():number{
        return this.opts.gravity.softDropMultiplier;
    }

    public get_tick_ms():number{
        return this.opts.gravity.tickMs;
    }

    public get_oppenent_grid_mode():'full'|'grid'|'highest'|'none'{
        return this.opts.multiplayer.seeOpponents
    }

    public get_preview_count():number{
        return this.opts.pieces.nextPreviewCount;
    }

    //MORE TO ADD ANYTIME WE NEED TO CHECK OPTS 
}