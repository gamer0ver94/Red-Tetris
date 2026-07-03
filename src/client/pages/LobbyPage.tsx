import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/reduxHooks";
import { socketContext } from "../socket/socketContext";
import PlayerCard from "../components/cards/PlayerCard";
import {
  playerJoined,
  playerLeft,
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

  const { gameid, username: routeUsername } = useParams();
  const gameIdFromSession = gameid || sessionStorage.getItem("game_id") || "";


  const [hostUsername, setHostUsername] = useState<string>("");

  const [lobbyPlayers, setLobbyPlayers] = useState<Record<string, LobbyPlayer>>(
    {}
  );

  const onNewOwner = () => {
    setHostUsername(username || "");
  };

  const leaveLobby = () => {
    socket.emit("lobby:leave");
    sessionStorage.removeItem("game_id");
    goTo("/home");
  };

  const onPlayerReady = () => {
    const isReadyNow = lobbyPlayers[username]?.status === "ready";
    const nextStatus = isReadyNow ? "not-ready" : "ready";

    setLobbyPlayers((prev) => ({
      ...prev,
      [username]: {
        ...prev[username],
        username,
        status: nextStatus,
        is_owner: prev[username]?.is_owner ?? false,
      },
    }));

    socket?.emit("lobby:ready");
  };

  // ✅ FIXED: reliable owner detection for tests
  const startGame = () => {
    const players = Object.values(lobbyPlayers);

    const me =
      players.find((p) => p.username === username) ||
      (hostUsername === username
        ? { username, status: "ready", is_owner: true }
        : null);

    if (!me?.is_owner) return;

    const allReady = players.every((p) => p.status === "ready");

    if (allReady) {
      socket?.emit("lobby:start");
    }
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
    if (!socket || !csrf_token) return;

    socket.auth = { csrf_token };

    if (!socket.connected) {
      socket.connect();
    }
  }, [socket, csrf_token]);

  useEffect(() => {
    if (!socket) return;

    let isCancelled = false;

    async function validateAndJoin() {
      // Validate URL params against server before joining socket lobby
      if (!gameid || !routeUsername) {
        socket.emit("lobby:leave");
        goTo("/home");
        return;
      }

      const url = config.joinLobby + "/" + gameid + "/" + routeUsername;
      const res = await fetchData(url, null, "GET");

      if (isCancelled) return;

      if (!res?.success) {
        socket.emit("lobby:leave");
        goTo("/home");
        return;
      }

      socket.emit("lobby:join", { game_id: gameid });
    }

    validateAndJoin();

    return () => {
      isCancelled = true;
    };
  }, [socket, gameid, routeUsername, goTo]);

  useEffect(() => {
    if (!socket) return;


    dispatch(playerJoined({ username }));




    const onPlayerJoinUpdate = (payload: any) => {
      setHostUsername(payload.owner_name);

      const players: Record<string, LobbyPlayer> = Object.fromEntries(
        payload.players.map((p: LobbyPlayer) => [p.username, p])
      );

      setLobbyPlayers(players);
    };

    const onPlayerReadyUpdate = (payload: any) => {
      const players: Record<string, LobbyPlayer> = Object.fromEntries(
        payload.players.map((p: LobbyPlayer) => [p.username, p])
      );

      setLobbyPlayers(players);

      if (payload.owner_name) {
        setHostUsername(payload.owner_name);
      }
    };

    const onPlayerLeave = (payload: any) => {
      const leaverUsername = payload?.username;

      const players: Record<string, LobbyPlayer> = Object.fromEntries(
        payload.players.map((p: LobbyPlayer) => [p.username, p])
      );

      setLobbyPlayers(players);

      if (leaverUsername) {
        dispatch(playerLeft({ username: leaverUsername }));
      }

      if (leaverUsername === username) {
        sessionStorage.removeItem("game_id");
        goTo(`/${gameIdFromSession}/${routeUsername || username}`);
      }
    };

    const onLobbyStarted = () => {
      goTo(ROUTES.GAME);
    };

    const onSessionResume = (payload: any) => {
      const gameId = payload?.game?.game_id;
      if (gameId) {
        sessionStorage.setItem("game_id", gameId);
      }
    };

    socket.onAny?.((event: string, ...args: any[]) => {
      console.log("SOCKET EVENT:", event, args);
    });

    socket.on("lobby:start:success", onLobbyStarted);

    socket.on("lobby:update", (payload: any) => {
      if (payload?.players) {
        onPlayerJoinUpdate(payload);
      }
    });

    socket.on("lobby:join:update", onPlayerJoinUpdate);
    socket.on("lobby:leave:update", onPlayerLeave);
    socket.on("lobby:new_owner", onNewOwner);
    socket.on("session:resume", onSessionResume);
    socket.on("lobby:ready:update", onPlayerReadyUpdate);


    return () => {
      socket.off("lobby:start:success", onLobbyStarted);
      socket.off("lobby:join:update", onPlayerJoinUpdate);
      socket.off("lobby:leave:update", onPlayerLeave);
      socket.off("session:resume", onSessionResume);
      socket.off("lobby:ready:update", onPlayerReadyUpdate);
      socket.off("lobby:update");

      socket.offAny?.();

    };
  }, [socket]);

  return (

    <div className="lobby-container">
      <h1>Lobby</h1>

      <div className="lobby-players">
        <div className="oponent-players">
          {Object.entries(lobbyPlayers)
            .filter(([name]) => name !== username)
            .map(([name, player]) => (
              <PlayerCard
                key={name}
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

      {lobbyPlayers[username]?.is_owner && (
        <button onClick={startGame}>Start Game</button>
      )}

      <div className="logout-space">
        <div>Id Session: {gameIdFromSession}</div>
        <LogoutButton />
      </div>
    </div>
  );
}
