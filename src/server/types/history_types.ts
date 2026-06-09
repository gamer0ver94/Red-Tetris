export type HistoryEntry = {
    username:string;
    is_winner:boolean;
    score:number;
    is_hidden:boolean;
    game_mode:string;
    total_time:string;
    end_date:string;
    lobby_id:string;
}

export type historyPageType =
| '/me'
| '/users'
| '/mode'
| '/date'
| '/score'
| '/lobby'
| '/win'
| '/lose';



