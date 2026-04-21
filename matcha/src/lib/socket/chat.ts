import { Payload, UnreadMessages } from "@/lib/types";
import { isUserActivelyChattingWith, send } from "./socket";
import { markConversationAsRead, storeMessage, getOnlineMatchedUsers, getUnreadCountByUsers } from "../db/chat";

export async function handleChatMessage(payload: Payload) {
  send(payload.to.id, "chat-msg", payload);
  send(payload.from.id, "chat-msg", payload);
  await storeMessage(payload.from.id, payload.to.id, payload.msg);

  if (isUserActivelyChattingWith(payload.to.id, payload.from.id)) {
    await markConversationAsRead(payload.from.id, payload.to.id);
  }

  await sendUnreadMessagesCount(payload.to.id);
}

export async function handleUsersInfo(payload: Payload) {
  const users = await getOnlineMatchedUsers(payload.from.id);
  send(payload.from.id, "chat-users", users);
  await sendUnreadMessagesCount(payload.from.id);
}

export async function sendUnreadMessagesCount(userId: string ) {
  const unreadMessages: UnreadMessages[] = await getUnreadCountByUsers(userId);
  send<UnreadMessages[]>(userId, "chat-unread-count", unreadMessages);
}