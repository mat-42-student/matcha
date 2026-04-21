import { Payload, UnreadMessages } from "@/lib/types";
import { send } from "./socket";
import { storeMessage, getOnlineMatchedUsers, getUnreadCountByUsers } from "../db/chat";

export async function handleChatMessage(payload: Payload) {
  send(payload.to.id, "chat-msg", payload); // send to recipient
  send(payload.from.id, "chat-msg", payload); // send to all sockets of sender
  await storeMessage(payload.from.id, payload.to.id, payload.msg);
  await sendUnreadMessagesCount(payload.to.id);
}

export async function handleUsersInfo(payload: Payload) {
  const users = await getOnlineMatchedUsers(payload.from.id);
  // console.log(`Sending ${users.length} chat users to ${payload.from.first_name}`);
  send(payload.from.id, "chat-users", users);
  sendUnreadMessagesCount(payload.from.id);
}

export async function sendUnreadMessagesCount(userId: string ) {
  const unreadMessages: UnreadMessages[] = await getUnreadCountByUsers(userId);
  // console.log(`Sending unread messages count to user ${userId}:`, unreadMessages);
  send<UnreadMessages[]>(userId, "chat-unread-count", unreadMessages);
}