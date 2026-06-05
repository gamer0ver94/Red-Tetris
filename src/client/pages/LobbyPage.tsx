import { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/reduxHooks';
import { socketContext } from '../socket/socketContext';
import PlayerCard from '../components/cards/PlayerCard';
import './LobbyPage.css';
import LogoutButton from '../components/LogoutButton';
import { ROUTES } from '../Types/Routes';

type LobbyPlayer = {
  player_id?: string;
  username: string;
  ready: boolean;
  is_owner?: boolean;
};

type LobbyRosterPayload = {
  players?: LobbyPlayer[];
  players_list?: string[];
  owner_id?: string;
  message?: string;
};

export default function LobbyPage() {
  const goTo = useNavigate();
  const username = useAppSelector((state) => state.user.username) || 'Player';

  const socket = useContext(socketContext);

  const [ready, setReady] = useState(false);
  // Temporarily commented out to keep the client build passing.
  // This roster state is not wired yet, and tsconfig has noUnusedLocals enabled.
  // const [players, setPlayers] = useState<Array<{ player_id: string; username: string; ready: boolean }>>([]);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  // const [joinCards, setJoinCards] = useState<string[]>([]);

  const gameIdFromSession = sessionStorage.getItem('game_id') || '';
  // Temporarily commented out to keep the client build passing.
  // Owner tracking is planned but not consumed yet, and tsconfig has noUnusedLocals enabled.
  // const [ownerId, setOwnerId] = useState<string | null>(null);

  // TODO: will be updated once server sends lobby roster.
  // For now, single-player lobby always behaves like host.
  const isSinglePlayerLobby = useMemo(() => true, []);

  const selfPlayer = players.find((player) => player.username === username);
  const isHost = selfPlayer?.is_owner ?? isSinglePlayerLobby;
  const displayedPlayers = players.length > 0
    ? players
    : [{ username, ready, is_owner: isHost }];

  function syncRoster(payload?: LobbyRosterPayload) {
    if (!payload)
      return;

    if (Array.isArray(payload.players) && payload.players.length > 0) {
      setPlayers(payload.players);

      const self = payload.players.find((player) => player.username === username);
      setReady(Boolean(self?.ready));
      return;
    }

    if (Array.isArray(payload.players_list) && payload.players_list.length > 0) {
      const playerNames = payload.players_list;

      setPlayers((prev) => playerNames.map((playerName) => {
        const existing = prev.find((player) => player.username === playerName);

        return {
          player_id: existing?.player_id,
          username: playerName,
          ready: existing?.ready ?? (playerName === username ? ready : false),
          is_owner: existing?.is_owner ?? (playerName === username ? isHost : false),
        };
      }));
    }
  }

  useEffect(() => {
    if (!socket) return;
    if (!socket.connected) {
      socket.auth = socket.auth ?? {};
      socket.connect();
    }

    return () => {
    };
  }, [socket]);

  // async function handleReadyToggle() {
  //   if (!isHost) return;
  //
  //   const next = !ready;
  //   setReady(next);
  //
  //   if (next && isHost) {
  //     socket?.emit('lobby:start');
  //     goTo('/game');
  //   }
  // }
  async function handleReadyToggle() {
    if (!socket) return;

    const onSuccess = (payload?: LobbyRosterPayload) => {
      socket.off('lobby:ready:success', onSuccess);
      socket.off('lobby:ready:error', onError);

      if (payload?.players || payload?.players_list) {
        syncRoster(payload);
        return;
      }

      setReady((prev) => !prev);
      setPlayers((prev) => prev.map((player) => (
        player.username === username
          ? { ...player, ready: !player.ready }
          : player
      )));
    };

    const onError = (payload: { reason: string }) => {
      socket.off('lobby:ready:success', onSuccess);
      socket.off('lobby:ready:error', onError);
      console.error(payload.reason);
    };

    socket.once('lobby:ready:success', onSuccess);
    socket.once('lobby:ready:error', onError);
    socket.emit('lobby:ready');
  }

  function handleStartGame() {
    if (!socket || !isHost) return;

    const onSuccess = () => {
      socket.off('lobby:start:success', onSuccess);
      socket.off('lobby:start:error', onError);
      goTo('/game');
    };

    const onError = (payload: { reason: string }) => {
      socket.off('lobby:start:success', onSuccess);
      socket.off('lobby:start:error', onError);
      console.error(payload.reason);
    };

    socket.once('lobby:start:success', onSuccess);
    socket.once('lobby:start:error', onError);
    socket.emit('lobby:start');
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

    const onJoinUpdate = (payload: LobbyRosterPayload) => {
      console.log('[socket] lobby:join:update', payload);
      // const message = String(payload?.message ?? '');
      // const firstWord = message.trim().split(/\s+/)[0];
      // if (firstWord) {
      //   setJoinCards((prev) => [firstWord, ...prev]);
      // }
      syncRoster(payload);
    };

    const onReadyUpdate = (payload: LobbyRosterPayload) => {
      console.log('[socket] lobby:ready:update', payload);
      syncRoster(payload);
    };

    socket.on('lobby:join:update', onJoinUpdate);
    socket.on('lobby:ready:update', onReadyUpdate);

    socket.emit('lobby:join', { game_id: gameIdFromSession });

    return () => {
      socket.off('lobby:join:update', onJoinUpdate);
      socket.off('lobby:ready:update', onReadyUpdate);
    };
  }, [socket, gameIdFromSession, username, ready, isHost]);

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
        <>
          {/*
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
          */}
          <div className="lobby-players">
            {displayedPlayers.map((player, idx) => {
              const isSelf = player.username === username;

              return (
                <PlayerCard
                  key={player.player_id ?? `${player.username}-${idx}`}
                  username={player.username}
                  ready={player.ready}
                  onReady={isSelf ? handleReadyToggle : () => {}}
                  onReturn={isSelf ? () => handleLeaveQueue() : () => {}}
                />
              );
            })}
          </div>

          {isHost && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleStartGame}>
                Start game
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
