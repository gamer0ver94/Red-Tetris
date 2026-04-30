import { createContext } from "react";
import { socket } from "./socket";

export const socketContext = createContext(socket);