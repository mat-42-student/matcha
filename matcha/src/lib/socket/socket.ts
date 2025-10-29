// matcha/src/server/socket.ts

import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import cookie from "cookie";
import { getSessionUser } from "@/lib/db/session";
import { Payload, PublicUser } from "@/lib/types";
import { handleChatMessage, handleUsersInfo } from "./chat";
import { handleNotif } from "./notifications";

const connectedUsers = new Map<string, Set<string>>() // Map<userId, Set<socket.id>>
let io: Server;

const system: PublicUser = {
  id: "System",
  first_name: "System",
  last_name: "System",
  email: "System",
  gender: "System",
  city: "System",
  latitude: 0,
  longitude: 0,
  distance: 0,
  bio: "System",
  age: 0,
  sex_pref: "System",
  interests: ["System"],
  fame: 0,
  score: 0,
  likeStatus: "none",
}

/***
 * Send data to all sockets of a user
 * @param userId - ID of the user
 * @param action - Action name
 * @param data - Data to send
 */
export function send<T>(userId: string, action: string, data: T) {
  const targetSockets = connectedUsers.get(userId);
  if (!targetSockets || targetSockets.size === 0) return;

  for (const socketId of targetSockets) {
    io.to(socketId).emit(action, data);
  }
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  async function authUser(socket: Socket, next: (err?:Error)=> void) {
    const raw = socket.handshake.headers.cookie || "";
    const cookies = cookie.parse(raw);
    const sessionId = cookies["session_id"];

    if (!sessionId) return next(new Error("unauthorized"));
    const user = await getSessionUser(sessionId);
    if (!user) return next(new Error("unauthorized"));

    socket.data.user = user;
    next();
  }

  function handleDisconnect(socket: Socket) {
    console.log(`\x1b[31mUser ${socket.data.user.first_name} disconnected\x1b[0m`);
  }

  function addSocket(s: Socket) {
    if (!connectedUsers.has(s.data.user.id)) connectedUsers.set(s.data.user.id, new Set())
    connectedUsers.get(s.data.user.id)!.add(s.id)
  }

  function handleConnection(socket: Socket) {
    console.log(`\x1b[32mUser ${socket.data.user.first_name} connected\x1b[0m`, socket.id);
    addSocket(socket);
    const welcome: Payload = {
      msg: `Hi ${socket.data.user.first_name}`,
      from: system,
      to: socket.data.user
    }
    socket.emit("notif", welcome)

    socket.on("disconnect", () => handleDisconnect(socket));
    socket.on("chat-msg", (payload: Payload) => handleChatMessage(payload));
    socket.on("get-chat-users", (payload: Payload) => handleUsersInfo(payload));
    socket.on("notif", (payload: Payload) => handleNotif(payload));
  }

  io.use(authUser); // middleware
  io.on("connection", (socket: Socket) => handleConnection(socket));

  return io;
}
