import { ChatMsgAck, ChatMsgEvent, ChatMsgPayload, MAX_MESSAGE_LENGTH, NotifPayload, SocketUser, UnreadMessages } from "@/lib/types";
import { isOnline, isUserActivelyChattingWith, send } from "./socket";
import { markConversationAsRead, storeMessage, getOnlineMatchedUsers, getUnreadCountByUsers, getChatPartner } from "../db/chat";
import { createNotification } from "../db/notifications";
import { getUserById } from "../db/users";
import { isValidUuid } from "../validators/serverValidator";

// At most RATE_LIMIT messages per user (all tabs together) every RATE_WINDOW_MS
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10_000;
const sentAt = new Map<string, number[]>();

function isRateLimited(userId: string) {
  const now = Date.now();
  const recent = (sentAt.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    sentAt.set(userId, recent);
    return true;
  }
  recent.push(now);
  sentAt.set(userId, recent);
  return false;
}

/***
 * Store and push a message. The answer is sent back to the client as the event's ack,
 * so a refused message is reported instead of silently dropped.
 */
export async function handleChatMessage(sender: SocketUser, event: ChatMsgEvent): Promise<ChatMsgAck> {
  if (typeof event?.to !== "string" || !isValidUuid(event.to) || typeof event?.msg !== "string") {
    return { ok: false, error: "Invalid message" };
  }

  const msg = event.msg.trim();
  if (!msg) return { ok: false, error: "Empty message" };
  if (msg.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Messages are limited to ${MAX_MESSAGE_LENGTH} characters` };
  }
  if (isRateLimited(sender.id)) return { ok: false, error: "You are sending messages too fast" };

  const recipient = await getChatPartner(sender.id, event.to);
  if (!recipient) return { ok: false, error: "You can no longer chat with this user" };

  const id = await storeMessage(sender.id, recipient.id, msg);

  const payload: ChatMsgPayload = { id, from: sender, to: recipient, msg };
  send(recipient.id, "chat-msg", payload);
  send(sender.id, "chat-msg", payload);
  await notifyRecipient(sender, recipient);
  return { ok: true };
}

// Errors are only logged: the message is already stored and delivered, the sender must not see it as failed
async function notifyRecipient(sender: SocketUser, recipient: SocketUser) {
  try {
    if (isUserActivelyChattingWith(recipient.id, sender.id)) {
      await markConversationAsRead(sender.id, recipient.id);
    } else {
      const senderName = (await getUserById(sender.id))?.username || "Someone";
      await createNotification(recipient.id, sender.id, "message", `${senderName} sent you a message`);
      send<NotifPayload>(recipient.id, "notif", { from: sender, msg: "message" });
    }

    await sendUnreadMessagesCount(recipient.id);
  } catch (err) {
    console.error("Failed to notify the message recipient:", err);
  }
}

export async function handleUsersInfo(userId: string) {
  const users = await getOnlineMatchedUsers(userId);
  send(userId, "chat-users", users);
  // online status of matches only, kept up to date by "presence" events
  send<string[]>(userId, "online-users", users.filter((u) => isOnline(u.id)).map((u) => u.id));
  await sendUnreadMessagesCount(userId);
}

export async function sendUnreadMessagesCount(userId: string ) {
  const unreadMessages: UnreadMessages[] = await getUnreadCountByUsers(userId);
  send<UnreadMessages[]>(userId, "chat-unread-count", unreadMessages);
}
