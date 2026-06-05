import { io } from "socket.io-client";

const protocol = window.location.protocol; // http: or https:
const hostname = window.location.hostname; // e.g. k1r1p11
const socketUrl = `${protocol}//${hostname}:1800`;

export const socket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
});
