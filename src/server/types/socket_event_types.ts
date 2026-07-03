import type { Server, Socket } from 'socket.io';
import type {GameStatus, PlayerStatus} from './status_types.ts'
import type { RenderPayload } from './render_types.js';
import { HistoryEntry, historyPageType, HistoryWatchState } from './history_types.js';

export type LobbyAction = 'join' | 'start' | 'leave';

export type LobbyOutcome = 'success' | 'error' | 'update';

export type LobbyEventName = 
| `lobby:${LobbyAction}`
| `lobby:${LobbyAction}:${LobbyOutcome}`
| `lobby:new_owner`;

export type LobbyStartData = {
    game_id:string,
    type:string,
    mode:string,
    status:GameStatus
}

export type moveAction = 'left' | 'right' | 'rotate';

export type dropAction = 'regular' | 'soft' | 'hard';

export type pressType = 'release'|'press';

export type ActionEventName = 
|`${moveAction}:${pressType}`
|`${dropAction}:${pressType}`


export interface ClientToServerEvents {
    'lobby:join': (p?:{ game_id:string}) => void;
    'lobby:ready': () => void;
    'lobby:start': () => void;
    'lobby:leave': () => void;
    'lobby:update': () => void;

    //Game actions
    'game:left:press':() => void;
    'game:left:release':() => void;
    'game:right:press':() => void;
    'game:right:release':() => void;
    'game:rotate:press':() => void;
    'game:rotate:release':() => void;
    'game:soft:press':() => void;
    'game:soft:release':() => void;
    'game:hard:press':() => void;
    'game:hard:release':() => void;
    'game:rotate':() => void;
    'game:hold':() => void;

    //history Actions
    'history:watch': (p:HistoryWatchState) => void;
    'history:unwatch': () => void;
}

export interface ServerToClientEvents{

    'lobby:ready:success': () => void;
    'lobby:ready:error': (p: {reason:string}) => void;
    'lobby:ready:update': (p: LobbyReadyPayload) => void;

    'lobby:join:error': (p: {reason:string}) => void;
    'lobby:join:success': () => void;
    'lobby:join:update': (p: LobbyReadyPayload) => void;

    'lobby:start:error': (p: {reason:string}) => void;
    'lobby:start:success': () => void;

    'lobby:leave:error': (p: {reason:string}) => void;
    'lobby:leave:success': () => void;
    'lobby:leave:update': (p: LobbyReadyPayload) => void;
    'lobby:new_owner': () => void;

    'game:render': (p: RenderPayload) => void;
    'game:win': (p: HistoryEntry[]) => void;
    'game:lose': (p: HistoryEntry[]) => void;
    'game:error': (p: {reason: string}) => void;

    'history:update': () => void;

    'player_status:change': (p: {new_status: PlayerStatus}) => void;
    'game_status:change': (p: {new_status: GameStatus}) => void;

    'session:resume': (p: SessionResumePayload) => void;
}

export interface SocketData {
  sid?: string;
  game_id?: string;
}


export type TypedIoServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
>;

export type SessionResumePayload = {
    reconnected: boolean;
    player:{
        player_id: string;
        username: string;
        player_status: PlayerStatus;
        csrf_token: string;
    };
    game:null | {
        game_id: string;
        owner_id: string;
        game_status: GameStatus;
        players_ids: string[];
    };
    render_state: null | RenderPayload;
}

export type LobbyPlayerState = {
    username:string;
    status:PlayerStatus;
    is_owner:boolean;
}

export type LobbyReadyPayload = {
    players: LobbyPlayerState[];
    owner_name:string;
    all_ready:boolean;
}
