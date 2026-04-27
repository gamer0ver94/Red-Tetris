import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Form.css";

import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { setUsername } from "../store/userSlice";

export default function Form() {
  const goTo = useNavigate();

  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.user.username);

  const [input, setInput] = useState("");

  async function confirm() {
    try {
      const res = await fetch("http://localhost:1800/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: input
        })
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();
      console.log(data);

      // save to redux
      dispatch(setUsername(data.username));

      goTo("/join");

    } catch (err) {
      console.error(err);
    }
  }

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