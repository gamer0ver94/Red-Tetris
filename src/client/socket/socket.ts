import { io } from "socket.io-client";

export const socket = io("http://localhost:1800", {
  autoConnect: false,
  withCredentials: true,
});
