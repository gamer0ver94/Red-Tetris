import type { Server, Socket } from 'socket.io';
import type {GameStatus, PlayerStatus} from './status_types.ts'
import { BoardType } from './game_types.js';

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

export type moveAction = 'left' | 'rigth' | 'rotate';

export type dropAction = 'regular' | 'soft' | 'heavy';

export interface ClientToServerEvents {
    'lobby:join': (p?:{ game_id:string}) => void;
    'lobby:start': () => void;
    'lobby:leave': () => void;

    'game:move': (p: {action:moveAction}) => void;
    'game:drop': (p: {action:dropAction}) => void;
}

export interface ServerToClientEvents{
    'lobby:join:error': (p: {reason:string}) => void;
    'lobby:join:success': () => void;
    'lobby:join:update': (p: {message:string}) => void;

    'lobby:start:error': (p: {reason:string}) => void;
    'lobby:start:success': (p: {data: {game_id:string; type:string; mode:string, status:'started'}}) => void;

    'lobby:leave:error': (p: {reason:string}) => void;
    'lobby:leave:success': () => void;
    'lobby:leave:update': (p: {message:string}) => void;
    'lobby:new_owner': () => void;

    'game:render': (p: RenderPayload) => void;
    'game:win': () => void;
    'game:lose': () => void;
    'game:error': (p: {reason: string}) => void;

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
//   InterServerEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
//   InterServerEvents,
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
        game_type: string;
        game_mode: string;
        game_status: GameStatus;
        players_ids: string[];
    };
    render_state: null | RenderPayload;
}

export type RenderPayload = {
  self:{
    current_pos:null| [number|null, number|null, number|null]; //x , y and rotation
    current_piece_type:null | string;
    board:BoardType;
  }
  opponents:Record<string, BoardType>;
}