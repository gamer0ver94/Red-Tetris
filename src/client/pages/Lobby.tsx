import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppSelector } from "../hooks/reduxHooks"
export default function Lobby() {
    const goTo = useNavigate()
    const username = useAppSelector((state) => state.user.username)
    function confirm(route:string) {
        goTo(route)
    }

    useEffect(()=>{
        
    },[])
    return (
        <div>
            <div>
                <h1>{username}</h1>
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