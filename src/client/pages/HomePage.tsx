import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { useEffect, useState } from "react";
import { fetchData, fetchDataJson } from "../components/fetch/fetch";
import { setCsrfToken, setUsername } from "../store/userSlice";
import { socket } from "../socket/socket";
import LogoutButton from "../components/LogoutButton";
import { ROUTES } from "../Types/Routes";
import "./HomePage.css";
import logo from "../assets/tetris_logo.png";
import Logo from "../components/Logo";
import { config } from "../conf";
import CustomOptionForm from "../components/CustomOptionForm";
import type { GameOptions } from "../components/CustomOptionForm";
import HistorySection from "../components/HistorySection";

export default function HomePage() {
  const goTo = useNavigate();
  const username = useAppSelector((state) => state.user.username);
  const csrf_token = useAppSelector((state) => state.user.csrf_token);

  const [gameIdInput, setGameIdInput] = useState("");
  const [, setHostUsername] = useState<string>("");
  const [gameMode, setGameMode] = useState("classic");
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");

  const defaultCustomOptions: GameOptions = {
    grid: {
      width: 10,
      height: 20,
      invisible: false,
      revealOnClearMs: 0,
      showLockHighlight: true,
    },
    pieces: {
      randomSequence: true,
      sharedSequence: true,
      allowHold: true,
      nextPreviewCount: 4,
    },
    gravity: {
      tickMs: 650,
      lockDelayMs: 150,
      maxLock: 10,
      softDropMultiplier: 0.3,
      fallAfterClear: false,
      speedOnLock: true,
    },
    garbage: {
      enabled: true,
      canClear: true,
      ratio: 1,
      clearCreateGarbage: false,
    },
    scoring: {
      enabled: true,
      backToBackBonus: true,
    },
    win: {
      condition: "survival",
      limit: null,
    },
    multiplayer: {
      enabled: true,
      maxPlayers: null,
      seeOpponents: "full",
    },
  };

  const [customOptions, setCustomOptions] =
    useState<GameOptions>(defaultCustomOptions);

  async function createLobbyAndGo() {
    setError("");
    if (!csrf_token) return;

    const payload: any = {
      game_mode: gameMode,
    };

    if (gameMode === "custom") {
      payload.options = customOptions;
    }
    console.log("HERE");
    console.log(payload);
    const res = await fetchDataJson(config.createLobby, payload, csrf_token);

    if (!res.ok) {
      console.error("/game/create failed", await res.text().catch(() => ""));
      setError("Failed to Join Game");
      return;
    }

    const data = await res.json();

    if (data?.success && data?.game_id) {
      setHostUsername(username ? username : "");
      sessionStorage.setItem("game_id", data.game_id);
      goTo(ROUTES.LOBBY);
    }
  }

  async function joinLobbyAndGo() {
    if (!csrf_token) {
      setError("You must be logged in to join a game.");
      return;
    }

    if (!gameIdInput.trim()) {
      setError("Please enter a valid game ID.");
      return;
    }

    const url =
      config.joinLobby + "/" + gameIdInput.trim() + "/" + (username || "");

    const res = await fetchData(url, null, "GET");

    if (!res.success) {
      setError("Failed to Join Game, server error.");
      return;
    }

    if (res?.success) {
      dispatch(setCsrfToken(res.csrf_token));
      if (res?.game_id) sessionStorage.setItem("game_id", res.game_id);
      goTo(ROUTES.LOBBY);
    } else {
      setError("Failed to Join Game");
    }
  }

  useEffect(() => {
    async function loadUser() {
      const data = await fetchData(config.authMe, null, "GET");

      if (data.username) dispatch(setUsername(data.username));
      if (data.csrf_token) dispatch(setCsrfToken(data.csrf_token));
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (!csrf_token) return;

    socket.auth = { csrf_token };

    if (!socket.connected) socket.connect();

    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [csrf_token]);

  return (
    <div className="home-page">
      <div className="welcome-container">
        <div>
          <h1 className="neon">Welcome, {username ? username : "No Player"}</h1>
        </div>
        <Logo text="" imagePath={logo} />
        <LogoutButton />
      </div>
      
      <div className="mode-create-container">
      <div className="mode">
        <h1>Mode: {gameMode}</h1>
        <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
          <option value="classic">Classic</option>
          <option value="easy">Easy</option>
          <option value="hard">Hard</option>
          <option value="battle">Battle</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      {gameMode === "custom" && (
        <CustomOptionForm
          options={customOptions}
          setOptions={setCustomOptions}
        />
      )}
        <div className="home-options neon">
          <button className="home-button" onClick={createLobbyAndGo}>
            Create
          </button>

          <input
            className="home-input"
            type="text"
            placeholder="game_id"
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.target.value)}
          />

          <button className="home-button" onClick={joinLobbyAndGo}>
            Join
          </button>

          <h1>{error}</h1>
        </div>
      </div>
      <HistorySection />
    </div>
  );
}
