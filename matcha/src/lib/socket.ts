import { io } from "socket.io-client";

export const socket = io(window.location.origin, {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  secure: true,
  withCredentials: true,
});
