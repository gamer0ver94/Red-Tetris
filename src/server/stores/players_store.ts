import { Player } from '../models/player_model.ts'
import { CodeType, ModelResult } from '../types/error_code_types.ts';
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
    public get_all_u_names(): string[]{
        
        return [... this.u_name_to_sid_map.keys()]
    }

    public get_all_ids(): string[]{
        
        return [... this.sid_to_player_map.values()].map((player) => player.get_player_id());
    }

    public get_player_by_socket_id(socket_id: string): ModelResult<Player, CodeType>{
        const sid = this.socket_id_to_sid_map.get(socket_id);
        if(!sid)
            return{success:false, code:'PLAYER_NOT_FOUND'};
        return this.get_player_by_sid(sid);
    }

    public get_player_by_username(username:string): ModelResult<Player, CodeType>{
        const sid = this.u_name_to_sid_map.get(username);
        if(!sid)
            return {success:false, code:'PLAYER_NOT_FOUND'}
        return this.get_player_by_sid(sid);
    }

    public get_player_by_sid(sid:string):ModelResult<Player, CodeType>{
        
        const player = this.sid_to_player_map.get(sid);
        if(!player)
            return {success:false, code:'PLAYER_NOT_FOUND'};
        return{success:true, data:player}
    }

    public get_player_by_id(player_id:string):ModelResult<Player, CodeType>{
        
        for(const val of this.sid_to_player_map.values()){
            if(val.get_player_id() == player_id)
                return {success:true, data:val};
        }
        return {success:false, code:'PLAYER_NOT_FOUND'};
    }

    // SETTERS
    public set_socket_by_sid(sid:string, socket_id:string) : ModelResult<null, CodeType>{
        
        const player_res = this.get_player_by_sid(sid);
        if(!player_res.success)
            return player_res;
        
        const player = player_res.data;
        //remove old socket from map
        this.socket_id_to_sid_map.delete(player.get_socket());
        
        player.set_socket(socket_id);

        //set new socket to map
        this.socket_id_to_sid_map.set(player.get_socket(), sid);
        return {success:true, data:null};
    }

    public set_player_status_by_sid(sid:string, player_status:PlayerStatus) : ModelResult<null, CodeType>{
        const player = this.get_player_by_sid(sid);
        if(!player.success) return player;
        player.data.set_player_status(player_status);
        return {success:true, data:null};
    }

    // METHODS

    // add a player in memory , returns 'success'| 'reason...'
    public add_player(player: Player) : ModelResult<null, CodeType> {
        
        const sid = player.get_sid();
        const username = player.get_username();
        
        if( this.sid_to_player_map.has(sid))
            return {success:false, code:'PLAYER_EXIST'}

        if (this.u_name_to_sid_map.has(username))
            return {success:false, code:'USERNAME_TAKEN'}

            this.sid_to_player_map.set(sid, player);
            this.socket_id_to_sid_map.set(player.get_socket(), sid);
            this.u_name_to_sid_map.set(player.get_username(), sid);

        return {success:true, data:null};
    }

    //remove user and all related data
    public remove_player(player:Player):ModelResult<null, CodeType>{
        
        const sid = player.get_sid();
        const existing = this.sid_to_player_map.get(sid);
        if (!existing)
            return {success:false, code:'SID_NOT_FOUND'};
        this.sid_to_player_map.delete(sid);
        this.u_name_to_sid_map.delete(existing.get_username());
        this.socket_id_to_sid_map.delete(existing.get_socket());
        return {success:true, data:null};
    } 
}