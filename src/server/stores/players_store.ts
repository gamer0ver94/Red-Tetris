import { Player } from '../models/player_model.ts'


// Class used to keep memory cache of player data
export class PlayerStore{
    private sid_to_player_map: Map<string, Player>

    constructor(){
        this.sid_to_player_map = new Map<string, Player>();
    }
    
    // GETTERS
    public async get_all_u_names(): Promise<Set<string>>{
        
        const u_names = new Set<string>;
        for(const player of this.sid_to_player_map.values()){
            u_names.add(player.get_username());
        }

        return u_names;
    }

    public async get_all_ids(): Promise<Set<string>>{
        
        const ids = new Set<string>;
        for (const player of this.sid_to_player_map.values()){
            ids.add(player.get_player_id())
        }
        return ids;
    }


    // SETTERS
    public async set_socket_by_sid(sid:string, socket_id:string) : Promise<string>{
        const player = await this.is_known(sid);
        if(!player) return 'Unknown sid';
        player.set_socket(socket_id);
        return 'success';
    }

    public async set_player_status_by_sid(sid:string, player_status:string) : Promise<string>{
        const player = await this.is_known(sid);
        if(!player) return 'Unknown sid';
        player.set_player_status(player_status);
        return 'success';
    }

    // METHODS

    // add a player in memory , returns 'success'| 'reason...'
    public async add_player(player: Player) : Promise<string> {
        
        const sid = player.get_sid();
        const u_name_list = await this.get_all_u_names()
        const username = player.get_username();
        
        if( this.sid_to_player_map.has(sid)){
            return 'You are already logged in'
        }

        if (u_name_list.has(username)){
            return 'Username taken, please choose another one'
        }

        try{
            this.sid_to_player_map.set(sid, player)
        }
        catch (error){
            return error instanceof Error? error.message : 'Unknow Error'
        }
        return 'success'
    }

    //Looks by secret ID if user exist
    public async is_known(sid:string) :Promise< Player | undefined >{
        if(this.sid_to_player_map.has(sid)){
            const player = this.sid_to_player_map.get(sid);
            if(! player)
                return undefined
            return player
        }
        return undefined
    }

    public async is_known_by_id(player_id:string): Promise<Player | undefined>{
    
        for (const value of this.sid_to_player_map.values()){
            if (value.get_player_id() == player_id)
                return value;
        }
        return undefined;
        
    }
}