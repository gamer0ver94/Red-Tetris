import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { PlayerStore } from '../stores/players_store.ts';
import type { Store } from '../stores/store.ts';
import * as auth_services from '../services/auth_services.ts';
import {socket_game_lobby} from '../sockets/game_lobby_sockets.ts'
import * as helpers from '../sockets/misc_sockets.ts'



export const register_sockets = (
  httpServer: HttpServer,
  store:Store,
  decodeSecureSession,
  allowedOrigin,
) => {
  
  // Create socket serv
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigin, credentials: true }
  });

  socket_middleware(io, store.get_player_store(), decodeSecureSession);

  // Acutal connection
  socket_connection(io, store);

  return io;
};

function socket_connection(io:Server, store:Store){
  
  io.on('connection', async (socket) => {
    
    const sid = socket.data?.sid;
    if(!sid) return socket.disconnect(true);

    //store socket_id in cache memory
    await store.get_player_store().set_socket_by_sid(sid, socket.id);

    //register events
    socket.on('disconnect', async() => {
      await helpers.change_player_status(io, 'disconnected', sid, store.get_player_store());
      await store.get_player_store().set_socket_by_sid(sid, `pending:reconnect:${Date.now()}`);
    });
    socket_game_lobby(io, socket, sid, store);

    await helpers.change_player_status(io, 'connected', sid, store.get_player_store());
  });
}

function socket_middleware(io: Server, player_store:PlayerStore, decodeSecureSession){
  
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

      //call net only if all is legit
      const ok = await auth_services.find_me(sid, player_store);
      if (! ok.is_known || ok.csrf_token !== csrf_token) // === false
        return next(new Error('forbidden'));
      socket.data.sid = sid;
      next();
  }
  catch{
      next(new Error('process error'));
  }
  });
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