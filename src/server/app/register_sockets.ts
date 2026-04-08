import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { PlayerStore } from '../stores/players_store.ts';
import * as auth_services from '../services/auth_services.ts'


function read_cookie(cookieHeader, name:string){
  const prefix = `${name}=`;
  for (const part of (cookieHeader || '').split(';')){
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix))
      return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return undefined;
}

export const register_sockets = (
  httpServer: HttpServer,
  player_store:PlayerStore,
  decodeSecureSession,
  allowedOrigin,
) => {
  
  // Create socket serv
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigin, credentials: true }
  });

  //Happends before connection, middleware
  io.use(async (socket, next) => {
    try{
      const csrf_token = socket.handshake?.auth?.csrf_token || '';
      if(!csrf_token) return next(new Error('missing csrf token'));

      const cookie_header = socket.handshake?.headers?.cookie || '';
      const session_cookie = read_cookie(cookie_header, 'rt.sid');
      if(!session_cookie) return next(new Error('missing session'));

      const session = decodeSecureSession(session_cookie);
      const sid = session?.get('sid') || '';
      if(!sid) return next (new Error('invalid session'));

      const ok = await auth_services.find_me(sid, player_store);
      if (! ok.is_known) // === false
        return next(new Error('forbidden'));
      socket.data.sid = sid;
      next();
    }
    catch{
      next(new Error('process error'));
    }
  });

  // Acutal connection
  io.on('connection', async (socket) => {
    
    const sid = socket.data?.sid;
    if(!sid) return socket.disconnect(true);

    //store socket_id in cache memory
    await player_store.set_socket_by_sid(sid, socket.id);

    //register events
    socket.on('disconnect', async() => {
      await player_store.set_state_by_sid(sid, 'disconnected');
      // socket.send({action: 'change_state', state: 'disconnected'});
      await player_store.set_socket_by_sid(sid, `pending:reconnect:${Date.now()}`);
    });
    
    // NEEDS TO WRAP BOTH ACTION IN SAME CALLS
    // send update
    await player_store.set_state_by_sid(sid, 'connected');
    socket.send({action:'change_state', state:'connected'});


  });

  return io;
};
