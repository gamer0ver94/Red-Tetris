import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks"
import { useEffect, useState } from "react"
import { fetchData } from "../components/fetch/fetch"
import { setCsrfToken, setUsername } from "../store/userSlice";
import { socket } from "../socket/socket";
import LogoutButton from "../components/LogoutButton";
import { ROUTES } from "../Types/Routes";
import "./HomePage.css"
import logo from "../assets/tetris_logo.png";
import Logo from "../components/Logo";
export default function HomePage() {
    const goTo = useNavigate()
    const username = useAppSelector((state) => state.user.username)
    const csrf_token = useAppSelector((state) => state.user.csrf_token)
    const [gameIdInput, setGameIdInput] = useState("");
  const [hostUsername, setHostUsername] = useState<string>('');
    const [gameMode, setGameMode] = useState("classic")
    const dispatch = useAppDispatch();
    const [error, setError] = useState("");

    async function createLobbyAndGo() {
        setError("");
        if (!csrf_token) return;

        const res = await fetch("http://localhost:1800/game/create", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrf_token,
            },
            body: JSON.stringify({ game_mode: gameMode }),
        });

        if (!res.ok) {
            console.error("/game/create failed", await res.text().catch(() => ""));
            setError("Failed to Join Game");
            return;
        }

        const data = await res.json();
        if (data?.success && data?.game_id) {
            setHostUsername(username?username:"");
            sessionStorage.setItem('game_id', data.game_id);
            goTo(ROUTES.LOBBY);
        }
    }

    async function joinLobbyAndGo() {
        if (!csrf_token){
            setError("You must be logged in to join a game.");
            return;
        }
        if (!gameIdInput.trim()){
            setError("Please enter a valid game ID.");
            return;
        }
        const res = await fetch(
            `http://localhost:1800/game/join/${encodeURIComponent(gameIdInput.trim())}/${encodeURIComponent(username || "")}`,
            {
                method: "GET",
                credentials: "include",
            }
        );
        console.log("Join response status:", res);
        if (!res.ok) {
            setError("Failed to Join Game, server error.");
            return;
        }

        const data = await res.json();
        if (data?.success) {
            dispatch(setCsrfToken(data.csrf_token));
            if (data?.game_id) sessionStorage.setItem('game_id', data.game_id);
            goTo(ROUTES.LOBBY);
        }
        else{
            setError("Failed to Join Game");
            console.log("Failed to join game:", data);
        }
    }



    useEffect(() => {
        async function loadUser() {
            const data = await fetchData("http://localhost:1800/auth/me", null, "GET");
            if (data.username) {
                dispatch(setUsername(data.username));
            }
            if (data.csrf_token) {
                dispatch(setCsrfToken(data.csrf_token));
            }
        }
        loadUser();
    }, []);

    useEffect(() => {
        if (!csrf_token) {
            return;
        }
        socket.auth = { csrf_token: csrf_token };
        if (!socket.connected) {
            socket.connect();
        }

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
            <div className="game-mode-container neon">
                <h1>Welcome, {username ? username : "No Player"}</h1>
            </div>
                <div className="mode neon">
                    <h1>Mode: {gameMode}</h1>
                    <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                        <option value="classic">Classic</option>
                        <option value="hard">Bonus</option>
                    </select>
                </div>
            <Logo text = "" imagePath={logo}/>
            <div className="home-options neon">
                <button className="home-button" onClick={createLobbyAndGo}>Create</button>
                <input className="home-input"
                    type="text"
                    placeholder="game_id"
                    value={gameIdInput}
                    onChange={(e) => setGameIdInput(e.target.value)}
                />
                <button className="home-button" onClick={joinLobbyAndGo}>Join</button>
                <h1>{error}</h1>
            </div>
            <div className="logout-space">
             <LogoutButton/>
            </div>
        </div>
    )
}
