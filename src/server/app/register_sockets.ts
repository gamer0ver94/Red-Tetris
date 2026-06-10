import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { PlayerStore } from '../stores/players_store.ts';
import type { Store } from '../stores/store.ts';
import * as auth_services from '../services/auth_services.ts';
import {socket_game_lobby} from '../sockets/game_lobby_sockets.ts'
import { socket_game_core } from '../sockets/game_core_sockets.ts';
import * as helpers from '../sockets/misc_sockets.ts'
import { playerStatusType, gameStatusType, PlayerStatus } from '../types/status_types.ts';
import type { TypedIoServer, SessionResumePayload, TypedSocket } from '../types/socket_event_types.ts';



type DecodeSecureSession = (cookieValue: string) => { get: (key: string) => unknown } | undefined;

const reconnect_timers = new Map<string, ReturnType<typeof setTimeout>>();
const active_socket_ids = new Map<string, string>();

export const register_sockets = (
  httpServer: HttpServer,
  store:Store,
  decodeSecureSession:DecodeSecureSession,
  allowedOrigin:string,
) => {
  
  // Create socket serv
  const io:TypedIoServer = new Server(httpServer, {
    cors: { origin: allowedOrigin, credentials: true }
  });

  socket_middleware(io, store.get_player_store(), decodeSecureSession);

  // Acutal connection
  socket_connection(io, store);

  return io;
};

function socket_connection(io: TypedIoServer, store: Store) {
  io.on('connection', (socket: TypedSocket) => {
    const sid = socket.data?.sid;
    if (!sid) {
      socket.disconnect(true);
      return;
    }


    socket.onAny((event, ...args) => {
      console.log('[socket incoming]', {
        event,
        args,
        socket_id: socket.id,
        sid,
      });
    });

    // Mark this socket as the currently active one immediately.
    active_socket_ids.set(sid, socket.id);

    socket.on('disconnect', async () => {
      await socket_disconnect(io, sid, store, socket.id);
    });

    void initialize_socket_connection(io, socket, sid, store);
  });
}

async function initialize_socket_connection(
  io: TypedIoServer,
  socket: TypedSocket,
  sid: string,
  store: Store,
) {
  const player_store = store.get_player_store();
  const player_res = player_store.get_player_by_sid(sid);

  if (!player_res.success) { 
    disconnect_socket(socket, sid, store);
    return;
  }
  const player = player_res.data;

  const reconnected = is_pending_socket(player.get_socket());
  clear_reconnect_timer(sid);

  // If another socket replaced this one while we were awaiting, stop here.
  if (active_socket_ids.get(sid) !== socket.id) {
    socket.disconnect(true);
    return;
  }

  player_store.set_socket_by_sid(sid, socket.id);

  if (active_socket_ids.get(sid) !== socket.id) {
    socket.disconnect(true);
    return;
  }

  const restore_status = await resolve_player_status(sid, store);
  if (!restore_status) {
    disconnect_socket(socket, sid, store);
    return;
  }

  if (active_socket_ids.get(sid) !== socket.id) {
    socket.disconnect(true);
    return;
  }

  player_store.set_player_status_by_sid(sid, restore_status);

  const resume = await build_session_resume_payload(sid, store, reconnected);
  if (resume && active_socket_ids.get(sid) === socket.id) {
    socket.emit('session:resume', resume);
  }

  socket_game_lobby(io, socket, sid, store);
  socket_game_core(socket, sid, store)
}

function socket_middleware(io: TypedIoServer, player_store:PlayerStore, decodeSecureSession:DecodeSecureSession){
  
  io.use(async (socket, next) => {
  try{
      
      //Look for safety token in handshake
      const csrf_token = socket.handshake?.auth?.csrf_token || '';
      if(!csrf_token) return next(new Error('missing csrf token'));

      //Look for session in cookie
      const cookie_header = socket.handshake?.headers?.cookie || '';
      const session_cookie = read_cookie(cookie_header, 'rt.sid');
      if(!session_cookie) return next(new Error('missing session'));

      //Get secret id
      const session = decodeSecureSession(session_cookie);
      const sid = session?.get('sid') || '';
      if(!sid) return next (new Error('invalid session'));

      //call next only if all is legit
      const ok_res = auth_services.find_me(sid.toString(), player_store);
      if (
        !ok_res.success ||
        !ok_res.data.is_known ||
        ok_res.data.csrf_token !== csrf_token
      )
        return next(new Error('forbidden'));
      socket.data.sid = sid.toString();
      next();
  }
  catch{
      next(new Error('process error'));
  }
  });
}

async function socket_disconnect(io: TypedIoServer, sid:string, store:Store, socket_id:string){
    const player_res = store.get_player_store().get_player_by_sid(sid);
    if (!player_res.success)
        return;
    const player = player_res.data;

    if(player.get_socket() !== socket_id)
        return;

    helpers.history_unwatch(sid, store);
    clear_reconnect_timer(sid);

    const marker = `pending_disconnect:${Date.now()}`;
    await helpers.change_player_status(io, playerStatusType.disconnected, sid, store.get_player_store());
    store.get_player_store().set_socket_by_sid(sid, marker);
    reconnect_timers.set(sid, setTimeout(async () => {
        reconnect_timers.delete(sid);

        const current_res = store.get_player_store().get_player_by_sid(sid);
        if (!current_res.success)
            return;
        const current = current_res.data;

        if(current.get_socket() !== marker)
            return;

        if (active_socket_ids.get(sid) === socket_id)
            active_socket_ids.delete(sid);

        auth_services.logout(sid, store, true);
    }, 30000));
}

function read_cookie(cookieHeader, name:string){
  const prefix = `${name}=`;
  for (const part of (cookieHeader || '').split(';')){
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix))
      return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return undefined;
}

function clear_reconnect_timer(sid:string){
    const timer = reconnect_timers.get(sid);
    if (timer){
        clearTimeout(timer);
        reconnect_timers.delete(sid);
    }
}

function is_pending_socket(socket_id:string){ 
    return socket_id.startsWith('pending_disconnect:');
}

async function resolve_player_status(sid:string, store:Store):Promise< PlayerStatus| null>{
    const player_res = store.get_player_store().get_player_by_sid(sid);
    if (!player_res.success)
        return null;

    const player = player_res.data;
    const lobby_res = store.get_lobby_store().get_lobby_by_player_id(player.get_player_id());
    if(!lobby_res.success)
        return playerStatusType.connected;

    const lobby = lobby_res.data;
    if(lobby.get_game_status() === gameStatusType.waiting)
        return playerStatusType.waiting;
    if(lobby.get_game_status() === gameStatusType.started)
        return playerStatusType.playing;
    return playerStatusType.connected;
}

async function build_session_resume_payload(
    sid:string,
    store:Store,
    reconnected: boolean
): Promise<SessionResumePayload | null>{
    const player_res = store.get_player_store().get_player_by_sid(sid);
    if (!player_res.success)
        return null;

    const player = player_res.data;
    const lobby_res = store.get_lobby_store().get_lobby_by_player_id(player.get_player_id());
    const lobby = lobby_res.success ? lobby_res.data : null;

    return {
        reconnected,
        player:{
            player_id: player.get_player_id(),
            username: player.get_username(),
            player_status: await resolve_player_status(sid, store) || playerStatusType.connected,
            csrf_token: player.get_csrf_token(),
        },
        game: lobby
        ?{
            game_id: lobby.get_lobby_id(),
            owner_id: lobby.get_owner_id(),
            game_status: lobby.get_game_status(),
            players_ids: lobby.get_player_ids(),
        }:null,
        render_state: null,
    };
}

function disconnect_socket(socket: TypedSocket, sid: string, store:Store) {
  if (active_socket_ids.get(sid) === socket.id) {
    helpers.history_unwatch(sid, store);
    active_socket_ids.delete(sid);
  }
  socket.disconnect(true);
}
