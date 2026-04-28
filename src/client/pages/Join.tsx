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
    const [playerMode, setPlayerMode] = useState("single_player")
    const [gameMode, setGameMode] = useState("classic")
    const dispatch = useAppDispatch();

    async function confirm(route: string) {
        const data = await fetchData("http://localhost:1800/auth/register", {
            username: username,
            playerMode: playerMode,
            gameMode: gameMode
        }, "POST");
        console.log(data);
        if (data.username) {
            goTo(route);
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
                <h1>{playerMode}</h1>
                <h1>{gameMode}</h1>
            </div>
            <div>
                <div>
                    <h1>Player Mode</h1>
                    <select value={playerMode} onChange={(e) => setPlayerMode(e.target.value)}>
                        <option value="single_player">Single Player</option>
                        <option value="multiplayer">Multiplayer</option>
                    </select>
                    <div>
                        <h1>Mode</h1>
                        <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                            <option value="classic">Classic</option>
                            <option value="Boost Mode">Boost Mode</option>
                        </select>
                    </div>
                </div>
                <div>
                    <button onClick={() => confirm("/lobby")}>Create</button>
                    <input type="text" />
                    <button onClick={() => confirm("/lobby")}>Join</button>
                </div>
            </div>
        </div>
    )
}

