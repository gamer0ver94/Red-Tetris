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

export type HistoryWatchState = 
| { page:'/me'; start:number; end:number }
| { page:'/users'; query:string; start:number; end:number }
| { page:'/mode'; mode:string; start:number; end:number }
| { page:'/date'; new_first:boolean; start:number; end:number }
| { page:'/score'; start:number; end:number }
| { page:'/lobby'; lobby_id:string; start:number; end:number }
| { page:'/win'; start:number; end:number }
| { page:'/lose'; start:number; end:number };

