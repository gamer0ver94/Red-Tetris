import { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/reduxHooks';
import { socketContext } from '../socket/socketContext';
import PlayerCard from '../components/PlayerCard/PlayerCard';
import './Lobby.css';

export default function Lobby() {
  const goTo = useNavigate();
  const username = useAppSelector((state) => state.user.username) || 'Player';

  const socket = useContext(socketContext);

  const [ready, setReady] = useState(false);

  // Single-player lobby: "all players ready" == the only user toggled to READY.
  const isSinglePlayerLobby = useMemo(() => true, []);

  useEffect(() => {
    // Ensure socket is connected before emitting lobby:start
    if (!socket) return;
    if (!socket.connected) {
      socket.auth = socket.auth ?? {};
      socket.connect();
    }

    return () => {
      // Keep socket alive; no cleanup here.
    };
  }, [socket]);

  async function handleReadyToggle() {
    const next = !ready;
    setReady(next);

    if (next && isSinglePlayerLobby) {
      // Server expects: client -> server 'lobby:start'
      socket.emit('lobby:start');
      // The server will start sending 'game:render'; route to /game.
      goTo('/game');
    }
  }

  return (
    <div className="lobby-container">
      <div className="lobby-header">LOBBY</div>

      {isSinglePlayerLobby ? (
        <div className="lobby-players">
          <PlayerCard
            username={username}
            ready={ready}
            onReady={handleReadyToggle}
            onReturn={() => goTo('/join')}
          />
        </div>
      ) : null}
    </div>
  );
}


