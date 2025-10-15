// matcha/src/server/socket.ts
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected :D", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected :(", socket.id);
    });

    socket.on("chat-message", (msg) => {
      console.log("Received:", msg);
      io.emit("chat-message", msg);
    });
  });

  return io;
}
