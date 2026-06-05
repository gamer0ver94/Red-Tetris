import { io } from "socket.io-client";
import { config } from "../conf"
export const socket = io(config.url, {
  autoConnect: false,
  withCredentials: true,
});
