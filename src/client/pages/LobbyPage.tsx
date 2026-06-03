import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/reduxHooks";
import { socketContext } from "../socket/socketContext";
import PlayerCard from "../components/cards/PlayerCard";
import "./LobbyPage.css";
import LogoutButton from "../components/LogoutButton";
import { ROUTES } from "../Types/Routes";
export default function LobbyPage() {
  const goTo = useNavigate();
  const username = useAppSelector((state) => state.user.username) || "Player";

  const socket = useContext(socketContext);

  const [ready, setReady] = useState(false);
  const [joinCards, setJoinCards] = useState<string[]>([]);

  const gameIdFromSession = sessionStorage.getItem("game_id") || "";
  const isSinglePlayerLobby = useMemo(() => true, []);

  const isHost = isSinglePlayerLobby;

  useEffect(() => {
    if (!socket) return;
    if (!socket.connected) {
      socket.auth = socket.auth ?? {};
      socket.connect();
    }

    return () => {};
  }, [socket]);

  async function handleReadyToggle() {
    if (!isHost) return;

    const next = !ready;
    setReady(next);

    if (next && isHost) {
      socket?.emit("lobby:start");
      goTo("/game");
    }
  }

  function handleLeaveQueue() {
    if (!socket) {
      goTo(ROUTES.HOME);
      return;
    }

    const onSuccess = () => {
      socket.off("lobby:leave:success", onSuccess);
      socket.off("lobby:leave:error", onError);
      goTo(ROUTES.HOME);
    };

    const onError = () => {
      socket.off("lobby:leave:success", onSuccess);
      socket.off("lobby:leave:error", onError);
    };

    socket.once("lobby:leave:success", onSuccess);
    socket.once("lobby:leave:error", onError);
    socket.emit("lobby:leave");
  }

  const sharePayload = gameIdFromSession
    ? {
        label: "Join Queue",
        gameId: gameIdFromSession,
      }
    : null;

  useEffect(() => {
    if (!socket) return;
    if (!gameIdFromSession) return;

    if (!socket.connected) {
      socket.auth = socket.auth ?? {};
      socket.connect();
    }

    const onJoinUpdate = (payload: any) => {
      console.log("[socket] lobby:join:update", payload);
      const message = String(payload?.message ?? "");
      const firstWord = message.trim().split(/\s+/)[0];
      if (firstWord) {
        setJoinCards((prev) => [firstWord, ...prev]);
      }
    };
    socket.on("lobby:join:update", onJoinUpdate);

    socket.emit("lobby:join", { game_id: gameIdFromSession });

    return () => {
      socket.off("lobby:join:update", onJoinUpdate);
    };
  }, [socket, gameIdFromSession]);

  return (
    <div className="lobby-container">
      <div>
        <h2>LOBBY</h2>
      </div>
      <div className="lobby-players">
        <div className="oponent-players">
          <PlayerCard
            username="oponent"
            ready={false}
            onReady={() => {}}
            onReturn={() => {}}
          />
          <PlayerCard
            username="oponent"
            ready={false}
            onReady={() => {}}
            onReturn={() => {}}
          />
          <PlayerCard
            username="oponent"
            ready={false}
            onReady={() => {}}
            onReturn={() => {}}
          />
          <PlayerCard
            username="oponent"
            ready={false}
            onReady={() => {}}
            onReturn={() => {}}
          />
          <PlayerCard
            username="oponent"
            ready={false}
            onReady={() => {}}
            onReturn={() => {}}
          />
          <PlayerCard
            username="oponent"
            ready={false}
            onReady={() => {}}
            onReturn={() => {}}
          />
        </div>
        <div className="player">
          <PlayerCard
            username="test"
            ready={false}
            onReady={() => {}}
            onReturn={() => {}}
          />
        </div>
      </div>
      <div className="logout-space">
        <LogoutButton />
      </div>
    </div>
  );
}
