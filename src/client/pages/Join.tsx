import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks"
import { useEffect, useState } from "react"
import { fetchData } from "../components/fetch/fetch"
import { setCsrfToken, setUsername } from "../store/userSlice";
import { socket } from "../socket/socket";

export default function Join() {
    const goTo = useNavigate()
    const username = useAppSelector((state) => state.user.username)
    const csrf_token = useAppSelector((state) => state.user.csrf_token)
    const [gameIdInput, setGameIdInput] = useState("");

    // Note: server game_mode enum is: classic | hard | easy | solo | battle
    const [gameMode, setGameMode] = useState("classic")
    const dispatch = useAppDispatch();

    async function registerPlayerAndGo(route: string) {
        const data = await fetchData("http://localhost:1800/auth/register", {
            username: username,
        }, "POST");
        if (data?.username) {
            dispatch(setUsername(data.username));
            if (data.csrf_token) dispatch(setCsrfToken(data.csrf_token));
            goTo(route);
        }
    }

    async function createLobbyAndGo() {
        if (!csrf_token) return;

        // IMPORTANT: /game/create requires X-CSRF-Token header
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
            return;
        }

        const data = await res.json();
        if (data?.success && data?.game_id) {
            // lobby will start when owner clicks Start (socket event)
            goTo("/lobby");
        }
    }

    async function joinLobbyAndGo() {
        if (!csrf_token) return;
        if (!gameIdInput.trim()) return;
        // /game/join requires both game_id and username in the URL
        const res = await fetch(
            `http://localhost:1800/game/join/${encodeURIComponent(gameIdInput.trim())}/${encodeURIComponent(username || "")}`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        if (!res.ok) {
            console.error("/game/join failed", await res.text().catch(() => ""));
            return;
        }

        const data = await res.json();
        if (data?.success) {
            dispatch(setCsrfToken(data.csrf_token));
            goTo("/lobby");
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
        <div>
            <div>
                <h1>Welcome, {username ? username : "No Player"}</h1>
            </div>
            <div>
                <h1>{gameMode}</h1>
            </div>
            <div>
                <div>
                    <h1>Mode</h1>
                    <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                        <option value="classic">Classic</option>
                        <option value="hard">Hard</option>
                        <option value="easy">Easy</option>
                        <option value="solo">Solo</option>
                        <option value="battle">Battle</option>
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
            </div>

            </div>
        </div>
    )
}

