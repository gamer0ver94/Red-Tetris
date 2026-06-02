import Logo from "../components/Logo";
import Form from "../components/Form";
import logo from "../assets/tetris_logo.png";
import "./RegisterPage.css"
export default function RegisterPage (){
    return (
        <div>
            <div>
                <Logo text = ""imagePath={logo}/>
            </div>
            <div>
                {/* Component Form */}
                <Form/>
            </div>
            <div>
                <h1>About Us</h1>
            </div>
            <div>
                <h1>About Project</h1>
            </div>
        </div>
    )
}
