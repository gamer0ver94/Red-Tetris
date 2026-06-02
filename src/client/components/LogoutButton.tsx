import {fetchData} from "./fetch/fetch";
import "./LogoutButton.css";
export default function LogoutButton(){
    const Logout = async () => {
        // Ensure logout request completes so server can clear rt.sid cookie.
        const res = await fetchData("/auth/logout", null, "GET");
        if (res == null) {
            window.location.href = "/";
            return;
        }
        window.location.href = "/";
    }
    return (
        <button onClick={Logout}>Logout</button>
    )
}
