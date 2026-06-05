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
import { ROUTES} from "../Types/Routes"
import "./LobbyPage.css";
import LogoutButton from "../components/LogoutButton";
import { config } from "../conf"
import { fetchData } from "../components/fetch/fetch";
import { setCsrfToken, setUsername } from "../store/userSlice";

export default function LobbyPage() {
  const dispatch = useAppDispatch();
  const goTo = useNavigate();
  const username = useAppSelector((state) => state.user.username) || "Player";
  const csrf_token = useAppSelector((state) => state.user.csrf_token);
  console.log("[Lobby] render: csrf_token exists?", !!csrf_token);
  const socket = useContext(socketContext);
  const readyByUsername = useAppSelector(
    (state) => state.lobby.readyByUsername,
  );
  const [status, setStatus] = useState<string>("not-ready");
  const gameIdFromSession = sessionStorage.getItem("game_id") || "";
  const [hostUsername, setHostUsername] = useState<string>('');

  const onNewOwner = (()=>{
    setHostUsername(username?username:"")
  })

  const leaveLobby = (()=>{
    socket.emit("lobby:leave");
    goTo("/");
  });

  const allPlayersReady = () => {
    for (const [, ready] of Object.entries(readyByUsername)) {
      if (ready != "ready") {
        return false;
      }
    }
    return true;
  };
  const onPlayerReady = () => {
    setStatus(status === "ready" ? "not-ready" : "ready");
    console.log("READY TO START");
    socket?.emit("player:ready", { username });
    if (allPlayersReady() && hostUsername) {
      socket?.emit("lobby:start");
    }
    socket?.emit("lobby:start", { username });
    dispatch(
      setPlayerReadyStatus({
        username,
        status: status === "ready" ? "not-ready" : "ready",
      }),
    );
  };

  useEffect(() => {
    async function loadUser() {
      const data = await fetchData(
        config.authMe,
        null,
        "GET",
      );
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
    console.log(
      "[Lobby] connect-effect: socket.connected=",
      socket?.connected,
      "csrf_token=",
      !!csrf_token,
    );
    if (!socket) return;
    if (!csrf_token) return;
    socket.auth = { csrf_token };

    if (!socket.connected) {
      socket.connect();
    } else {
      console.log("[Lobby] socket already connected, not calling connect()");
    }
  }, [socket, csrf_token]);

  useEffect(() => {
    if (!socket) return;

    console.log(
      "[Lobby] listeners effect mounted. socket.connected=",
      socket.connected,
    );

    dispatch(playerJoined({ username }));

    if (gameIdFromSession) {
      socket.emit("lobby:join", { game_id: gameIdFromSession });
    }

    dispatch(playerJoined({ username }));
    socket.on("connect", () => {
      console.log(
        "Connected."
      );
    });

    socket.on("connect_error", (err) => {
      console.error("[Lobby] Socket connection error:", err.message);
    });

    const onPlayerJoinUpdate = (payload: any) => {
      const message: string | undefined = payload?.message;

      const extractedUsername = message?.replace(" just joined the lobby", "");

      if (extractedUsername && extractedUsername.trim().length > 0) {
        dispatch(playerJoined({ username: extractedUsername }));
      }
      console.log("On join update:", payload);
    };

    const onPlayerLeave = (payload: any) => {
      const leaverUsername = payload?.username;
      console.log("Player leave:", payload)
      if (leaverUsername) {
        dispatch(playerLeft({ username: leaverUsername }));
      }
      console.log(payload);

      if (leaverUsername && leaverUsername === username) {
        sessionStorage.removeItem("game_id");
        goTo("/");
      }
    };

    const onSessionResume = (payload: any) => {
      console.log("session:resume", payload);

      const gameId = payload?.game?.game_id;
      if (gameId) {
        sessionStorage.setItem("game_id", gameId);
      }
    };

    socket.onAny((event, ...args) => {
      console.log("SOCKET EVENT:", event, args);
    });

    const onLobbyStarted = () => {
      console.log("HELLO WORLD", readyByUsername)
      
      goTo(ROUTES.GAME);
    };

    socket.on("lobby:start:success", onLobbyStarted);
    socket.on("lobby:join:update", onPlayerJoinUpdate);
    socket.on("lobby:leave:update", onPlayerLeave);
    socket.on("lobby:new_owner", onNewOwner);
    socket.on("session:resume", onSessionResume);

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("lobby:join:update", onPlayerJoinUpdate);

      socket.off("lobby:leave:update", onPlayerLeave);
      socket.off("session:resume", onSessionResume);
      socket.off("lobby:start:success", onLobbyStarted);
      socket.offAny();
    };
  }, [socket]);
  return (
    <div className="lobby-container">
      <h1>Lobby</h1>
      <div className="lobby-players">
        <div className="oponent-players">
          <div className="oponent-players">
            {Object.entries(readyByUsername)
              .filter(([playerName]) => playerName !== username)
              .map(([playerName, status]) => (
                <PlayerCard
                  key={playerName}
                  username={playerName}
                  ready={status === "ready"}
                  onReady={() => {}}
                  onReturn={leaveLobby}
                />
              ))}
          </div>
        </div>
        <div className="player">
          <PlayerCard
            username={username}
            ready={(readyByUsername[username] ?? "not-ready") === "ready"}
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
