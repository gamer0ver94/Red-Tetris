import {useNavigate } from "react-router-dom"
import "./Form.css"

export default function Form() {
    const goTo = useNavigate()
    
    function confirm() {
        // Will make a request to the server to create a new player and then redirect to the join page
        goTo("/join")
    }
    return (
        <div>
            <input type="text" placeholder="Username" />
            <button onClick={confirm}>Confirm</button>
        </div>
    )
}