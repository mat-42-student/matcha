// ce fichier ne sert pas

import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server | null = null;

export function initSocketServer(server: HttpServer) {
  if (io) return io; // éviter plusieurs instances

  io = new Server(server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });

  io.on("connection", (socket) => {
    console.log(`Client connecté: ${socket.id}`);

    // Exemple: authentification via query
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      socket.data.userId = userId;
      socket.join(`user:${userId}`); // room perso
    }

    socket.on("chat:message", (msg) => {
      console.log("Message reçu:", msg);
      io!.emit("chat:message", msg); // broadcast global
    });

    socket.on("chat:private", ({ to, text }) => {
      io!.to(`user:${to}`).emit("chat:private", {
        from: socket.data.userId,
        text,
      });
    });

    socket.on("disconnect", () => {
      console.log(`Client déconnecté: ${socket.id}`);
    });
  });

  console.log("✅ Socket.io initialisé");
  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io non initialisé");
  return io;
}
