import Logo from "../components/Logo";
import Form from "../components/Form";
import logo from "../assets/tetris_logo.png";
import "./RegisterPage.css"
import { useEffect } from "react";
import { fetchData } from "../components/fetch/fetch"
import { config } from "../conf"
import { setCsrfToken, setUsername } from "../store/userSlice";
import { useAppDispatch } from "../hooks/reduxHooks";
import { useNavigate } from "react-router-dom";
export default function RegisterPage (){
      const dispatch = useAppDispatch ();
      const goTo = useNavigate ();
      useEffect(() => {
        async function loadUser() {
          const data = await fetchData(config.authMe, null, "GET");
          if (data?.username) {
            dispatch(setUsername(data.username));
          }
          if (data?.csrf_token) {
            dispatch(setCsrfToken(data.csrf_token));
            goTo("/home");
          } else {
            // goTo("/");
          }
        }
    
        loadUser();
      }, [dispatch]);
    return (
        <div className="register-page">
            <div>
                <Logo text = ""imagePath={logo}/>
            </div>
            <div>
                {/* Component Form */}
                <Form/>
            </div>
            <div className="about-container neon">
                <h1>About Us</h1>
                <h1>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised thanks to these sheets and more recently with desktop publishing software including versions of Lorem Ipsum.</h1>
            </div>
            <div className="about-container neon">
                <h1>About Project</h1>
                <h1>Where does it come from?
Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.</h1>
            </div>
        </div>
    )
}
