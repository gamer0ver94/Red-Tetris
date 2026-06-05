import {fetchData} from "./fetch/fetch";
import "./LogoutButton.css";
export default function LogoutButton(){
    const Logout = async () => {
        const res = await fetchData("/auth/logout", null, "GET");
        if (res == null) {
            window.location.href = "/";
            return;
        }
        window.location.href = "/";
    }
    return (
        <button className="logout-button" onClick={Logout}>Logout</button>
    )
}
