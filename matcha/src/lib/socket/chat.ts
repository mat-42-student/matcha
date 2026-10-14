import { ChatMsgEvent, MAX_MESSAGE_LENGTH, NotifPayload, Payload, SocketUser, UnreadMessages } from "@/lib/types";
import { isUserActivelyChattingWith, send } from "./socket";
import { markConversationAsRead, storeMessage, getOnlineMatchedUsers, getUnreadCountByUsers, getChatPartner } from "../db/chat";
import { createNotification } from "../db/notifications";
import { getUserById } from "../db/users";

export async function handleChatMessage(sender: SocketUser, event: ChatMsgEvent) {
  if (typeof event?.to !== "string" || typeof event?.msg !== "string") return;

  const msg = event.msg.trim();
  if (!msg || msg.length > MAX_MESSAGE_LENGTH) return;

  const recipient = await getChatPartner(sender.id, event.to);
  if (!recipient) return;

  await storeMessage(sender.id, recipient.id, msg);

  const payload: Payload = { from: sender, to: recipient, msg };
  send(recipient.id, "chat-msg", payload);
  send(sender.id, "chat-msg", payload);

  if (isUserActivelyChattingWith(recipient.id, sender.id)) {
    await markConversationAsRead(sender.id, recipient.id);
  } else {
    const senderName = (await getUserById(sender.id))?.username || "Someone";
    await createNotification(recipient.id, sender.id, "message", `${senderName} sent you a message`);
    send<NotifPayload>(recipient.id, "notif", { from: sender, msg: "message" });
  }

  await sendUnreadMessagesCount(recipient.id);
}

export async function handleUsersInfo(userId: string) {
  const users = await getOnlineMatchedUsers(userId);
  send(userId, "chat-users", users);
  await sendUnreadMessagesCount(userId);
}

export async function sendUnreadMessagesCount(userId: string ) {
  const unreadMessages: UnreadMessages[] = await getUnreadCountByUsers(userId);
  send<UnreadMessages[]>(userId, "chat-unread-count", unreadMessages);
}
