import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Form.css";

import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { setUsername } from "../store/userSlice";
import { fetchData } from "./fetch/fetch";
import { socket } from "../socket/socket";

export default function Form() {
  const goTo = useNavigate();
  const dispatch = useAppDispatch();

  const [input, setInput] = useState("");

  async function confirm() {
    const payload = {
      username: input
    }
    const data = await fetchData("http://localhost:1800/auth/register", payload, "POST");
    console.log(data);
    dispatch(setUsername(input));
    if (data.username) {
      goTo("/join");
    }
  }

  useEffect(() => {
    socket.connect();
  },[]);

  return (
    <div>
      <input
        type="text"
        placeholder="Username"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={confirm}>Confirm</button>
    </div>
  );
}