import Logo from "../components/Logo";
import Form from "../components/Form";

export default function Home (){
    return (
        <div className="home">
            <div>
                <Logo text="" imagePath="/src/assets/tetris_logo.png"/>
            </div>
            <div>
                <Form/>
            </div>
            <div>
                <h1>AboutUs</h1>
            </div>
        </div>
    )
}
