import { useNavigate } from "react-router-dom"
import { useAppSelector } from "../hooks/reduxHooks"
import { io } from "socket.io-client"
export default function Join() {
    const goTo = useNavigate()
    const username = useAppSelector((state) => state.user.username)
    function confirm(route:string) {
        goTo(route)
    }
    return (
        <div>
            <div>
                <h1>{username ? username : "No Player"}</h1>
            </div>
            <div>
                <h1>Mode</h1>
                <h1>Default</h1>
            </div>
            <div>
                <div>
                    <h1>SinglePlayer</h1>
                </div>
                <div>
                    <h1>MultiPlayer</h1>
                </div>
                <div>
                    <h1>Mode</h1>
                </div>
                <div>
                    <button onClick={()=>confirm("/lobby")}>Create</button>
                    <input type="text" />
                    <button onClick={()=>confirm("/lobby")}>Join</button>
                </div>
            </div>
        </div>
    )
}