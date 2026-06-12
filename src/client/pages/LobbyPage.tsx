import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/reduxHooks";
import { socketContext } from "../socket/socketContext";
import PlayerCard from "../components/cards/PlayerCard";
import {
  playerJoined,
  playerLeft,
  setPlayerReadyStatus,
} from "../store/lobbySlice";
import { ROUTES } from "../Types/Routes";
import "./LobbyPage.css";
import LogoutButton from "../components/LogoutButton";
import { config } from "../conf";
import { fetchData } from "../components/fetch/fetch";
import { setCsrfToken, setUsername } from "../store/userSlice";
type LobbyPlayer = {
  username: string;
  status: string;
  is_owner: boolean;
};
export default function LobbyPage() {
  const dispatch = useAppDispatch();
  const goTo = useNavigate();
  const username = useAppSelector((state) => state.user.username) || "Player";
  const csrf_token = useAppSelector((state) => state.user.csrf_token);
  const socket = useContext(socketContext);
  const readyByUsername = useAppSelector(
    (state) => state.lobby.readyByUsername,
  );
  const [status, setStatus] = useState<string>("not-ready");
  const gameIdFromSession = sessionStorage.getItem("game_id") || "";
  const [hostUsername, setHostUsername] = useState<string>("");
  const [lobbyPlayers, setLobbyPlayers] = useState<Record<string, LobbyPlayer>>(
    {},
  );
  useEffect(() => {
    console.log("lobbyPlayers changed:", lobbyPlayers);
  }, [lobbyPlayers]);
  const onNewOwner = () => {
    setHostUsername(username ? username : "");
  };

  const leaveLobby = () => {
    socket.emit("lobby:leave");
    goTo("/home");
  };

  const allPlayersReady = () => {
    for (const [, ready] of Object.entries(readyByUsername)) {
      if (ready != "ready") {
        return false;
      }
    }
    return true;
  };
const onPlayerReady = () => {
  const isReadyNow = lobbyPlayers[username]?.status === "ready";
  const nextStatus = isReadyNow ? "not-ready" : "ready";

  // 1. optimistic update
  setLobbyPlayers((prev) => {
    const updated = {
      ...prev,
      [username]: {
        ...prev[username],
        username,
        status: nextStatus,
        is_owner: prev[username]?.is_owner ?? false,
      },
    };

    // 2. check AFTER update is computed
    const isOwner = updated[username]?.is_owner;

    const allReady = Object.values(updated).every(
      (p) => p.status === "ready"
    );

    if (isOwner && allReady) {
      socket?.emit("lobby:start");
    }

    return updated;
  });

  // 3. notify server
  socket?.emit("lobby:ready");
};

  useEffect(() => {
    async function loadUser() {
      const data = await fetchData(config.authMe, null, "GET");
      if (data?.username) {
        dispatch(setUsername(data.username));
      }
      if (data?.csrf_token) {
        dispatch(setCsrfToken(data.csrf_token));
      } else {
        goTo("/");
      }
    }

    loadUser();
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return;
    if (!csrf_token) return;
    socket.auth = { csrf_token };

    if (!socket.connected) {
      socket.connect();
    } else {
    }
  }, [socket, csrf_token]);

  useEffect(() => {
    if (!socket) return;
    dispatch(playerJoined({ username }));

    if (gameIdFromSession) {
      socket.emit("lobby:join", { game_id: gameIdFromSession });
    }

    dispatch(playerJoined({ username }));
    socket.on("connect", () => {
      console.log("Connected.");
    });

    socket.on("connect_error", (err) => {
      console.error("[Lobby] Socket connection error:", err.message);
    });

    const onPlayerJoinUpdate = (payload: {
      all_ready: boolean;
      owner_name: string;
      players: LobbyPlayer[];
    }) => {
      setHostUsername(payload.owner_name);

      const players: Record<string, LobbyPlayer> = Object.fromEntries(
        payload.players.map((p) => [p.username, p]),
      );

      setLobbyPlayers(players);
    };
    const onPlayerReadyUpdate = (payload: {
      players: LobbyPlayer[];
      owner_name?: string;
    }) => {
      const players: Record<string, LobbyPlayer> = Object.fromEntries(
        payload.players.map((p) => [p.username, p]),
      );

      setLobbyPlayers(players);

      if (payload.owner_name) {
        setHostUsername(payload.owner_name);
      }
    };
    const onPlayerLeave = (payload: any) => {
      const leaverUsername = payload?.username;
      const players: Record<string, LobbyPlayer> = Object.fromEntries(
        payload.players.map((player: LobbyPlayer) => [player.username, player]),
      );
      setLobbyPlayers(players);
      if (leaverUsername) {
        dispatch(playerLeft({ username: leaverUsername }));
      }

      if (leaverUsername && leaverUsername === username) {
        sessionStorage.removeItem("game_id");
        goTo("/");
      }
    };

    const onSessionResume = (payload: any) => {
      const gameId = payload?.game?.game_id;
      if (gameId) {
        sessionStorage.setItem("game_id", gameId);
      }
    };

    socket.onAny((event, ...args) => {
      console.log("SOCKET EVENT:", event, args);
    });

    const onLobbyStarted = () => {
      goTo(ROUTES.GAME);
    };

    socket.on("lobby:start:success", onLobbyStarted);
    socket.on("lobby:join:update", onPlayerJoinUpdate);
    socket.on("lobby:leave:update", onPlayerLeave);
    socket.on("lobby:new_owner", onNewOwner);
    socket.on("session:resume", onSessionResume);
    socket.on("lobby:ready:update", onPlayerReadyUpdate);

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("lobby:join:update", onPlayerJoinUpdate);

      socket.off("lobby:leave:update", onPlayerLeave);
      socket.off("session:resume", onSessionResume);
      socket.off("lobby:start:success", onLobbyStarted);
      socket.off("lobby:ready:update", onPlayerReadyUpdate);
      socket.offAny();
    };
  }, [socket]);
return (
  <div className="lobby-container">
    <h1>Lobby</h1>

    <div className="lobby-players">
      <div className="oponent-players">
        {Object.entries(lobbyPlayers)
          .filter(([playerName]) => playerName !== username)
          .map(([playerName, player]) => (
            <PlayerCard
              key={playerName}
              username={player.username}
              isOwner={player.is_owner}
              status={player.status}
            />
          ))}
      </div>

      <div className="player">
        <PlayerCard
          username={username}
          isOwner={lobbyPlayers[username]?.is_owner ?? false}
          status={lobbyPlayers[username]?.status ?? "not-ready"}
          onReady={onPlayerReady}
          onReturn={leaveLobby}
        />
      </div>
    </div>

    <div className="logout-space">
      <div>{gameIdFromSession}</div>
      <LogoutButton />
    </div>
  </div>
);
}
