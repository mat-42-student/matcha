import { io } from "socket.io-client";

// Utilise window.location.origin pour ne pas hardcoder l’URL
export const socket = io(window.location.origin, {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  secure: true,
  withCredentials: true,
});
