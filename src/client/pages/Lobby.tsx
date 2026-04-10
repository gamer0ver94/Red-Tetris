import { useNavigate } from "react-router-dom"

export default function Lobby() {
    const goTo = useNavigate()

    function confirm(route:string) {
        goTo(route)
    }
    return (
        <div>
            <div>
                <h1>Player1</h1>
            </div>
            <div>
                <h1>Mode</h1>
                <h1>Default</h1>
            </div>
            <div>
                <button>Start</button>
                <button onClick={()=>confirm("/join")}>Return</button>
            </div>
        </div>
    )
}