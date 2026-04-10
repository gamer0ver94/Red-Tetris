import { useNavigate } from "react-router-dom"

export default function Join() {
    const goTo = useNavigate()
    
    function confirm(route:string) {
        goTo(route)
    }
    return (
        <div>
            <div>
                <h1>Player Name</h1>
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