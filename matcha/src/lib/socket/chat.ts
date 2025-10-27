import { Server } from "socket.io";
import { Payload } from "@/lib/types";
import { send } from "./socket";
import { storeMessage, getOnlineMatchedUsers } from "../db/chat";

export function handleChatMessage(payload: Payload, io: Server) {
  send(payload.to.id, "chat-msg", payload, io); // send to recipient
  send(payload.from.id, "chat-msg", payload, io); // send to all sockets of sender
  storeMessage(payload.from.id, payload.to.id, payload.msg);
}

export async function handleUsersInfo(payload: Payload, io: Server) {
  const users = await getOnlineMatchedUsers(payload.from.id);
  console.log(`Sending ${users.length} chat users to ${payload.from.first_name}`);
  send(payload.from.id, "chat-users", users, io);
}
