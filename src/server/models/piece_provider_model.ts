import { pieceType, PieceType } from "../types/game_types.ts";
import { CodeType, ModelResult } from "../types/error_code_types.ts";



export class PieceProvider{

    private pieces:PieceType[];
    private random_sequence:boolean;
    private shared_sequence_enabled:boolean;

    private shared_sequence:PieceType[];
    private player_sequences:Map<string, PieceType[]>;
    private player_index: Map<string, number>;

    constructor(
        players_ids:string[],
        random:boolean,
        shared:boolean
    ){
        
        this.pieces = Object.values(pieceType) as PieceType[];
        this.random_sequence = random;
        this.shared_sequence_enabled = shared;

        this.shared_sequence = this.create_sequence();
        this.player_sequences = new Map<string, PieceType[]>();
        this.player_index = new Map<string, number>();

        for (const player_id of players_ids)
            this.register_player(player_id);
        
    }

    public register_player(player_id:string):ModelResult<null, CodeType>{
        const res = this.validate_for_player(player_id);
        if(res.success)
            return {success:false, code:'PLAYER_IN_ACTIVE_GAME'};

        if(!this.shared_sequence_enabled)
            this.player_sequences.set(player_id, this.create_sequence());
        this.player_index.set(player_id, 0);
        return {success:true, data:null};
    }

    public remove_player(player_id:string):ModelResult<null, CodeType>{

        const res = this.validate_for_player(player_id);
        if(!res.success)
            return {success:false, code:'PLAYER_NOT_REGISTERED'}
        this.player_sequences.delete(player_id);
        this.player_index.delete(player_id);
        return{success:true, data:null}
    }

    public get_next_piece_for_player(player_id:string):ModelResult<PieceType, CodeType>{

        const res = this.validate_for_player(player_id);
        if (!res.success)
            return res;
        const sequence = res.data.sequence;
        const index = res.data.index;
        const piece = sequence[index];
        this.advance_player(player_id, sequence);

        return {success:true,data:piece};
    }

    public peek_for_player(player_id:string, count:number):ModelResult<PieceType[], CodeType>{
        
        const pieces:PieceType[] = [];
        const res = this.validate_for_player(player_id);
        if (!res.success)
            return res;
        const sequence = res.data.sequence;
        const index = res.data.index;
        
        for(let offset = 0; offset < count; offset ++)
            pieces.push(this.peek_one_for_player(sequence, index, offset))

        return {success:true, data:pieces};
    }

    private peek_one_for_player(sequence:PieceType[], index:number, offset:number){

        return sequence[(index+offset) % sequence.length];
    }

    private advance_player(player_id:string, sequence:PieceType[]){

        const index = this.player_index.get(player_id)!;
        const next_index = index + 1;

        if(next_index < sequence.length){
            this.player_index.set(player_id, next_index);
            return;
        }
        if(this.random_sequence && this.shared_sequence_enabled){
            this.shared_sequence.push(...this.create_sequence());
            this.player_index.set(player_id, next_index);
            return;
        }
        if(this.random_sequence)
            this.replace_sequence_for_player(player_id, this.create_sequence());
        this.player_index.set(player_id, 0);
    }

    private get_sequence_for_player(player_id:string):PieceType[]|undefined{
        
        if(this.shared_sequence_enabled)
            return this.shared_sequence;

        const sequence = this.player_sequences.get(player_id);
        return sequence
    }

    private replace_sequence_for_player(player_id:string, sequence:PieceType[]){
        if( this.shared_sequence_enabled){
            this.shared_sequence = sequence;
            return;
        }

        this.player_sequences.set(player_id, sequence);
    }

    private create_sequence():PieceType[]{
        if(this.random_sequence){
            return this.shuffle([...this.pieces])
        }
        return [... this.pieces]
    }

    private shuffle(sequence:PieceType[]):PieceType[]{
        for (let i = sequence.length - 1; i > 0; i --){
            const j = Math.floor(Math.random() * (i + 1));
            [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
        }
        return sequence;
    }

    private validate_for_player(player_id:string):ModelResult<{sequence:PieceType[], index:number}, CodeType>{
        
        const sequence = this.get_sequence_for_player(player_id);
        if(!sequence)
            return {success:false, code:'PIECE_SEQUENCE_NOT_FOUND'};
        if(sequence.length === 0)
            return {success:false, code:'PIECE_SEQUENCE_EMPTY'}
        
        const index = this.player_index.get(player_id);
        if(index === undefined)
            return {success:false, code:'PIECE_INDEX_NOT_FOUND'};
        if(index < 0 || index >= sequence.length)
            return {success:false, code:'PIECE_INDEX_MISMATCH'};

        return {success:true, data:{sequence, index}};

    }
}