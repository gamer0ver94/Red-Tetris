import Logo from "../components/Logo";
import Form from "../components/Form";

export default function Home (){
    return (
        <div className="home">
            <div>
                <Logo text="" imagePath="/src/assets/tetris_logo.png"/>
            </div>
            <div>
               {/*Component*/}
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
