// matcha/src/server/socket.ts

import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import cookie from "cookie";
import { getSessionUser } from "@/lib/db/session";

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const raw = socket.handshake.headers.cookie || "";
    const cookies = cookie.parse(raw);
    const sessionId = cookies["session_id"];
    if (!sessionId) return next(new Error("unauthorized"));

    const user = await getSessionUser(sessionId);
    if (!user) return next(new Error("unauthorized"));

    socket.data.user = user;
    console.log("Welcome ", user.first_name)
    next();
  });

  io.on("connection", (socket) => {
    console.log(`\x1b[32mUser connected\x1b[0m`, socket.id);

    socket.on("disconnect", () => {
      console.log("\x1b[31mUser disconnected\x1b[0m", socket.id);
    });

    socket.on("chat-message", (msg) => {
      console.log("Received:", msg);
      io.emit("chat-message", msg);
    });
  });

  return io;
}
