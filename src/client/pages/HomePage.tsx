import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks"
import { useEffect, useState } from "react"
import { fetchData } from "../components/fetch/fetch"
import { setCsrfToken, setUsername } from "../store/userSlice";
import { socket } from "../socket/socket";
import LogoutButton from "../components/LogoutButton";
import { ROUTES } from "../Types/Routes";
export default function HomePage() {
    const goTo = useNavigate()
    const username = useAppSelector((state) => state.user.username)
    const csrf_token = useAppSelector((state) => state.user.csrf_token)
    const [gameIdInput, setGameIdInput] = useState("");

    const [gameMode, setGameMode] = useState("classic")
    const dispatch = useAppDispatch();
    const [error, setError] = useState("");

    // Temporarily commented out to keep the client build passing.
    // This helper is currently unused, and tsconfig has noUnusedLocals enabled.
    // async function registerPlayerAndGo(route: string) {
    //     const data = await fetchData("/register", {
    //         username: username,
    //     }, "POST");
    //     if (data?.username) {
    //         dispatch(setUsername(data.username));
    //         if (data.csrf_token) dispatch(setCsrfToken(data.csrf_token));
    //         goTo(route);
    //     }
    // }

    async function createLobbyAndGo() {
        setError("");
        if (!csrf_token) return;

        const res = await fetch("game/create", {
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
            `game/join/${encodeURIComponent(gameIdInput.trim())}/${encodeURIComponent(username || "")}`,
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
            const data = await fetchData("auth/me", null, "GET");
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
        <div>
            <div>
                <h1>Welcome, {username ? username : "No Player"}</h1>

            </div>
            <div>
                <h1>Mode: {gameMode}</h1>
            </div>
            <div>
                <div>
                    <h1>Mode</h1>
                    <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                        <option value="classic">Classic</option>
                        <option value="hard">Bonus</option>
                    </select>
                </div>

            <div>
                <button onClick={createLobbyAndGo}>Create</button>
                <input
                    type="text"
                    placeholder="game_id"
                    value={gameIdInput}
                    onChange={(e) => setGameIdInput(e.target.value)}
                />
                <button onClick={joinLobbyAndGo}>Join</button>
                <h1>{error}</h1>
            </div>
            </div>
             <LogoutButton/>
        </div>
    )
}
