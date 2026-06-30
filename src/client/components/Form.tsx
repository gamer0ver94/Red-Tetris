import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Form.css";

import { useAppDispatch } from "../hooks/reduxHooks";
import { setUsername, setCsrfToken } from "../store/userSlice";
import { fetchData } from "./fetch/fetch";
import { ROUTES } from "../Types/Routes";
import "./Form.css";
import { config } from "../conf";
export default function Form() {
  const goTo = useNavigate();
  const dispatch = useAppDispatch();

  const [input, setInput] = useState("");

  async function confirm() {
    const payload = {
      username: input,
    };
    const data = await fetchData(config.register, payload, "POST");
    if (data.username) {
      dispatch(setUsername(data.username));
      dispatch(setCsrfToken(data.csrf_token));
      goTo(ROUTES.HOME);
    }
  }
  return (
    <div className="form-container neon">
      <h1>Username:</h1>
      <input
        className="register-input"
        type="text"
        placeholder="Username"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button className="button-register" onClick={confirm}>
        Confirm
      </button>
    </div>
  );
}
