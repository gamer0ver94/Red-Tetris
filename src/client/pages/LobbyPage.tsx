import { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/reduxHooks';
import { socketContext } from '../socket/socketContext';
import PlayerCard from '../components/cards/PlayerCard';
import './LobbyPage.css';
import LogoutButton from '../components/LogoutButton';
import { ROUTES } from '../Types/Routes';
export default function LobbyPage() {
  const goTo = useNavigate();
  const username = useAppSelector((state) => state.user.username) || 'Player';

  const socket = useContext(socketContext);

  const [ready, setReady] = useState(false);
  const [players, setPlayers] = useState<Array<{ player_id: string; username: string; ready: boolean }>>([]);
  const [joinCards, setJoinCards] = useState<string[]>([]);


  const gameIdFromSession = sessionStorage.getItem('game_id') || '';

  const [ownerId, setOwnerId] = useState<string | null>(null);

  // TODO: will be updated once server sends lobby roster.
  // For now, single-player lobby always behaves like host.
  const isSinglePlayerLobby = useMemo(() => true, []);

  const isHost = isSinglePlayerLobby;



  useEffect(() => {
    if (!socket) return;
    if (!socket.connected) {
      socket.auth = socket.auth ?? {};
      socket.connect();
    }

    return () => {
    };
  }, [socket]);

  async function handleReadyToggle() {
    if (!isHost) return;

    const next = !ready;
    setReady(next);

    if (next && isHost) {
      socket?.emit('lobby:start');
      goTo('/game');
    }
  }


  function handleLeaveQueue() {
    if (!socket) {
      goTo(ROUTES.HOME);
      return;
    }

    const onSuccess = () => {
      socket.off('lobby:leave:success', onSuccess);
      socket.off('lobby:leave:error', onError);
      goTo(ROUTES.HOME);
    };

    const onError = () => {
      socket.off('lobby:leave:success', onSuccess);
      socket.off('lobby:leave:error', onError);
    };

    socket.once('lobby:leave:success', onSuccess);
    socket.once('lobby:leave:error', onError);
    socket.emit('lobby:leave');
  }


  const sharePayload = gameIdFromSession ? {
    label: 'Join Queue',
    gameId: gameIdFromSession,
  } : null;

  useEffect(() => {
    if (!socket) return;
    if (!gameIdFromSession) return;

    if (!socket.connected) {
      socket.auth = socket.auth ?? {};
      socket.connect();
    }

    const onJoinUpdate = (payload: any) => {
      console.log('[socket] lobby:join:update', payload);
      const message = String(payload?.message ?? '');
      const firstWord = message.trim().split(/\s+/)[0];
      if (firstWord) {
        setJoinCards((prev) => [firstWord, ...prev]);
      }
    };
    socket.on('lobby:join:update', onJoinUpdate);

    socket.emit('lobby:join', { game_id: gameIdFromSession });


    return () => {
      socket.off('lobby:join:update', onJoinUpdate);
    };
  }, [socket, gameIdFromSession]);


  return (
    <div className="lobby-container">

      <div className="lobby-header">LOBBY</div>
      <LogoutButton />
      {sharePayload ? (
        <div style={{ marginBottom: 16 }}>
          <div><strong>{sharePayload.label}</strong></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              readOnly
              value={sharePayload.gameId}
              style={{ width: 420 }}
            />
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
          </div>
        </div>
      ) : null}


      {isSinglePlayerLobby ? (
        <div className="lobby-players">
          <PlayerCard
            username={username}
            ready={ready}
            onReady={handleReadyToggle}
            onReturn={() => handleLeaveQueue()}
          />
          {joinCards.map((cardName, idx) => (
            <PlayerCard
              key={`${cardName}-${idx}`}
              username={cardName}
              ready={false}
              onReady={() => {}}
              onReturn={() => {}}
            />
          ))}
        </div>
      ) : null}

    </div>
  );
}


