import { Payload, UnreadMessages } from "@/lib/types";
import { send } from "./socket";
import { storeMessage, getOnlineMatchedUsers, getUnreadCountByUsers } from "../db/chat";

export function handleChatMessage(payload: Payload) {
  send(payload.to.id, "chat-msg", payload); // send to recipient
  send(payload.from.id, "chat-msg", payload); // send to all sockets of sender
  storeMessage(payload.from.id, payload.to.id, payload.msg);
  sendUnreadMessagesCount(payload.to.id);
}

export async function handleUsersInfo(payload: Payload) {
  const users = await getOnlineMatchedUsers(payload.from.id);
  console.log(`Sending ${users.length} chat users to ${payload.from.first_name}`);
  send(payload.from.id, "chat-users", users);
  sendUnreadMessagesCount(payload.from.id);
}

async function sendUnreadMessagesCount(userId: string ) {
  const unreadMessages: UnreadMessages[] = await getUnreadCountByUsers(userId);
  send(userId, "chat-unread-count", unreadMessages);
}