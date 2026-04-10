export class Game{

    private game_id: string;
    private owner_id: string;
    private player_ids: Set<string>;
    private game_type: 'single_player'| 'multi_player';
    private game_mode: string;
    private game_status: string;

    constructor(
        game_id: string,
        owner_id: string,
        game_type: 'single_player' | 'multi_player',
        game_mode: string, //ADD VARIOUS MODE HERE
    ){
        this.game_id = game_id;
        this.owner_id = owner_id;
        this.player_ids = new Set<string>();
        this.player_ids.add(owner_id);
        this.game_type = game_type;
        this.game_mode = game_mode;
        this.game_status = 'created';
    }

    // Getters
    public get_game_id(): string{
        return this.game_id
    }
    
    public get_owner_id(): string {
        return this.owner_id
    }

    public get_player_ids(): Set<string> {
        return this.player_ids!
    }

    public get_game_type(): string {
        return this.game_type
    }

    public get_game_mode(): string {
        return this.game_mode
    }

    public get_game_status(): string {
        return this.game_status
    }


    //Setters
    public set_game_status(game_status: string) {
        this.game_status = game_status
    }

    public set_owner(new_owner: string){
        this.owner_id = new_owner
    }

    public add_player(new_player: string){
        this.player_ids.add(new_player)
    }

    public remove_player(player: string){
        this.player_ids.delete(player)
    }
}