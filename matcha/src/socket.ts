// matcha/src/socket.ts

"use client";
import { io } from "socket.io-client";

export const socket = io(window.location.origin, {
  path: "/socket.io",
  transports: ["websocket"],
  withCredentials: true,
  auth: {
    userId: "123", // à remplacer par ton ID user réel
  },
});
