import Logo from "../components/Logo";
import Form from "../components/Form";
import logo from "../assets/tetris_logo.png";
export default function Home (){
    return (
        <div className="home">
            <div>
                <Logo text = ""imagePath={logo}/>
            </div>
            <div>
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
