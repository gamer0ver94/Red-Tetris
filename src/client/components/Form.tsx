import {useNavigate } from "react-router-dom"
import "./Form.css"

export default function Form() {
    const goTo = useNavigate()
    
    function confirm() {
        goTo("/join")
    }
    return (
        <div>
            <input type="text" placeholder="Username" />
            <button onClick={confirm}>Confirm</button>
        </div>
    )
}