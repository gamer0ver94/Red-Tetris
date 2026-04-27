import { Player } from '../models/player_model.ts'
import { PlayerStatus } from '../types/status_types.ts';


// Class used to keep memory cache of player data
export class PlayerStore{
    private sid_to_player_map: Map<string, Player>
    private socket_id_to_sid_map : Map<string, string>
    private u_name_to_sid_map : Map<string, string>

    constructor(){
        this.sid_to_player_map = new Map<string, Player>();
        this.socket_id_to_sid_map = new Map<string, string>();
        this.u_name_to_sid_map = new Map<string, string>();
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

    public async get_player_by_socket_id(socket_id: string): Promise<Player | undefined>{
        const sid = this.socket_id_to_sid_map.get(socket_id);
        const player = this.sid_to_player_map.get(sid!);
        return (player)
    }

    public async get_player_by_username(username:string): Promise<Player | undefined>{
        const sid = this.u_name_to_sid_map.get(username);
        const player = this.sid_to_player_map.get(sid!);
        return (player)
    }

    public async get_player_by_sid(sid:string):Promise<Player | undefined>{
        return(this.sid_to_player_map.get(sid))
    }

    public async get_player_by_id(player_id:string):Promise<Player | undefined>{
        
        for(const val of this.sid_to_player_map.values()){
            if(val.get_player_id() == player_id)
                return val;
        }
        return undefined;
    }

    // SETTERS
    public async set_socket_by_sid(sid:string, socket_id:string) : Promise<string>{
        
        const player = await this.get_player_by_sid(sid);
        if(!player)
            return 'Unknown sid';
        
        //remove old socket from map
        this.socket_id_to_sid_map.delete(player.get_socket());
        
        player.set_socket(socket_id);

        //set new socket to map
        this.socket_id_to_sid_map.set(player.get_socket(), sid);
        return 'success';
    }

    public async set_player_status_by_sid(sid:string, player_status:PlayerStatus) : Promise<string>{
        const player = await this.get_player_by_sid(sid);
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
            this.sid_to_player_map.set(sid, player);
            this.socket_id_to_sid_map.set(player.get_socket(), sid);
            this.u_name_to_sid_map.set(player.get_username(), sid);
        }
        catch (error){
            return error instanceof Error? error.message : 'Unknow Error'
        }
        return 'success'
    }

    //remove user and all related data
    public async remove_player(player:Player):Promise<string>{
        
        const sid = player.get_sid();
        const existing = this.sid_to_player_map.get(sid);
        if (!existing)
            return 'Unknown sid';
        this.sid_to_player_map.delete(sid);
        this.u_name_to_sid_map.delete(existing.get_username());
        this.socket_id_to_sid_map.delete(existing.get_socket());
        return 'success';
    } 
}