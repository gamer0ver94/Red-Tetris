import { GameOptions } from "./game_options_types.js";
import { GameStatus, PlayerStatus } from "./status_types.js";

export const codeType = {

    INTERNAL_ERROR:'Internal Error',

    USERNAME_TAKEN:'username is taken. please choose another one',
    USERNAME_REQUIRED:'username is required cannot be empty',
    USERNAME_MISMATCH:'wrong username, please use the register one',
    SID_NOT_FOUND:'session id not found',
    SID_MISSING:'missing session id please register first',
    GAME_ID_MISSING:'missing game id',
    CSRF_MANIP:'token manipulation error',
    NOT_OWNER:'user is not lobby owner',

    LOBBY_NOT_FOUND:'lobby not found',
    LOBBY_EXIST:'lobby already exist',
    LOBBY_CANNOT_JOIN:'lobby is not joinable for now',
    
    ACTIVE_GAME_NOT_FOUND: 'active game not found',
    ACTIVE_GAME_EXIST:'active game already exist',

    PIECE_CANNOT_SPAWN: 'piece cannot spawn',
    PIECE_SEQUENCE_NOT_FOUND: 'sequence not found error',
    PIECE_SEQUENCE_EMPTY: 'piece sequence found but empty',
    PIECE_INDEX_NOT_FOUND: 'index for piece not found error',
    PIECE_INDEX_MISMATCH:'index mismatch with sequence length',
    
    PLAYER_IN_LOBBY:'player is already in a lobby',
    PLAYER_NOT_FOUND:'player not found',
    PLAYER_NOT_REGISTERED:'player is not registered in system',
    PLAYER_IN_ACTIVE_GAME: 'player is already in an active game',
    PLAYER_EXIST:'player already exist',
    PLAYER_LOGIN:'player is already logged in',

    BOARD_NOT_FOUND:'current board not found',
    TIMER_NOT_FOUND:'timer not found',
    GAME_STATUS_UNKNOWN:'unkown game_status',

    NOT_ALLOWED:'action not allowed',
    ONLY_HOLD_ONCE:'hold is only allowed once until piece lock',
} as const;
export type CodeType = keyof typeof codeType;

export type ModelResult<T, Code extends CodeType = CodeType> =
  | { success: true; data: T }
  | { success: false; code: Code; details?:any};

export type LeaveGameData = {
    deleted: boolean;
    stopped_loop: boolean;
    forfeit?:boolean;
    leaver_name:string;
    socket_ids:string[];
    new_owner:boolean;
    new_owner_socket?:string;
}

export type LogoutData = {
    was_in_game:boolean;
    leave_data:LeaveGameData|null;
    deleted_user:boolean;
    player_socket_id:string;
    player_id:string;
    username:string;
}

export type PlayerData = {
    is_known:boolean;
    player_id?:string;
    player_status?:PlayerStatus;
    username?:string;
    socket_id?:string;
    csrf_token?:string;
}

export type JoinLobbyData = {
    username:string;
    socket_ids:string[];
}


export type StartGameData = {
    game_id:string;
    opts:GameOptions;
    game_status:GameStatus;
    sids:string[];
    socket_ids:string[];
}