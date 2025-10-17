import { Server } from "socket.io";
import { Payload } from "@/lib/types";
import { connectedUsers } from "./socket";
import { storeMessage, getOnlineMatchedUsers } from "../db/chat";

function send<T>(userId: string, action: string, data: T, io: Server) {
  const targetSockets = connectedUsers.get(userId);
  if (!targetSockets || targetSockets.size === 0) return;

  for (const socketId of targetSockets) {
    io.to(socketId).emit(action, data);
  }
}

export function handleChatMessage(payload: Payload, io: Server) {
  send(payload.to.id, "chat-msg", payload.msg, io); // send to recipient
  send(payload.from.id, "chat-msg", payload.msg, io); // send to all sockets of sender
  storeMessage(payload.from.id, payload.to.id, payload.msg);
}

export async function handleUsersInfo(payload: Payload, io: Server) {
  const users = await getOnlineMatchedUsers(payload.from.id);
  console.log("Sending chat users to ", payload.from.first_name, users);
  send(payload.from.id, "chat-users", users, io);
}
