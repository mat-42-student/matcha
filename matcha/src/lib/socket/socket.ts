// matcha/src/server/socket.ts

import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
// @ts-expect-error -- cookie comes with socket.io and ships without type declarations
import cookie from "cookie";
import { getSessionUser } from "@/lib/db/session";
import { ChatMsgEvent, NotifPayload, PresencePayload, PublicUser, RelationChangedPayload, SocketUser } from "@/lib/types";
import { handleChatMessage, handleUsersInfo, sendUnreadMessagesCount } from "./chat";
import { updateLastLogin } from "../db/users";
import { getMatchIds, markConversationAsRead } from "../db/chat";

type SocketRegistry = Map<string, Set<Socket>>;

declare global {
  var matchaSocketRegistry: SocketRegistry | undefined;
  var matchaSocketServer: Server | undefined;
}

const connectedUsers: SocketRegistry = globalThis.matchaSocketRegistry ?? new Map<string, Set<Socket>>();
globalThis.matchaSocketRegistry = connectedUsers;

let io: Server | undefined = globalThis.matchaSocketServer;

export function isOnline(userId: string) {
  return connectedUsers.has(userId);
}

/***
 * Tell the connected matches of a user that they came online or went offline.
 * Online status is private: only matches see it, never the whole server.
 */
async function sendPresence(userId: string, online: boolean) {
  for (const matchId of await getMatchIds(userId)) {
    send<PresencePayload>(matchId, "presence", { userId, online });
  }
}


const system: SocketUser = {
  id: "System",
  first_name: "System",
}

/***
 * Strip a user down to what other users may see through sockets
 */
export function toSocketUser(user: Pick<PublicUser, "id" | "first_name">): SocketUser {
  return { id: user.id, first_name: user.first_name };
}

/***
 * Register a socket event handler, catching errors so a bad payload or a DB error cannot crash the server
 */
function on<T>(socket: Socket, event: string, handler: (payload: T) => unknown) {
  socket.on(event, async (payload: T) => {
    try {
      await handler(payload);
    } catch (err) {
      console.error(`Socket handler "${event}" failed:`, err);
    }
  });
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

  for (const socket of targetSockets) {
    socket.emit(action, data);
  }
}

/***
 * Push a block to every tab of both users, silently: their clients drop the relation,
 * then reload the chat list and the notifications (removed by the block)
 */
export function sendBlock(blockerId: string, blockedId: string) {
  send<RelationChangedPayload>(blockedId, "relation-changed", { userId: blockerId, likeStatus: "block" });
  send<RelationChangedPayload>(blockerId, "relation-changed", { userId: blockedId, likeStatus: "block" });
}

export function isUserActivelyChattingWith(userId: string, otherUserId: string) {
  const targetSockets = connectedUsers.get(userId);
  if (!targetSockets || targetSockets.size === 0) return false;

  for (const socket of targetSockets) {
    if (socket.data.activeChatUserId === otherUserId) {
      return true;
    }
  }

  return false;
}

export async function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Leave non-socket.io upgrades (Next HMR) alone instead of closing them after 1s
    destroyUpgrade: false,
  });

  globalThis.matchaSocketServer = io;

  async function authUser(socket: Socket, next: (err?:Error)=> void) {
    const raw = socket.handshake.headers.cookie || "";
    const cookies = cookie.parse(raw);
    const sessionId = cookies["session_id"];

    if (!sessionId) return next(new Error("unauthorized"));
    try {
      const user = await getSessionUser(sessionId);
      if (!user) return next(new Error("unauthorized"));

      // Comes from the my_profile view (no password, but contains the email): never forward it as-is to other users
      socket.data.user = user;
      next();
    } catch (err) {
      console.error("Socket auth failed:", err);
      next(new Error("unauthorized"));
    }
  }

  function handleDisconnect(socket: Socket) {
    const userId = socket.data.user.id;
    const sockets = connectedUsers.get(userId);
    if (sockets) {
      sockets.delete(socket);
      if (sockets.size === 0){
        connectedUsers.delete(userId);
        updateLastLogin(userId).catch((err) => console.error("Failed to update last login:", err));
        sendPresence(userId, false).catch((err) => console.error("Failed to send presence:", err));
      }
    }
    console.log(`\x1b[31mUser ${socket.data.user.first_name} disconnected\x1b[0m`);
  }

  function addSocket(s: Socket) {
    if (!connectedUsers.has(s.data.user.id)) connectedUsers.set(s.data.user.id, new Set())
    connectedUsers.get(s.data.user.id)!.add(s)
  }

  async function handleConnection(socket: Socket) {
    console.log(`\x1b[32mUser ${socket.data.user.first_name} connected\x1b[0m`, socket.id);
    // The acting user is always the session user (socket.data.user), never an id sent by the client
    const userId: string = socket.data.user.id;

    const firstTab = !isOnline(userId);
    addSocket(socket);
    if (firstTab) sendPresence(userId, true).catch((err) => console.error("Failed to send presence:", err));
    // Also written on connection: if the server stops, the disconnect never writes it
    updateLastLogin(userId).catch((err) => console.error("Failed to update last login:", err));

    const welcome: NotifPayload = {
      msg: `Hi ${socket.data.user.first_name}`,
      from: system,
    }

    socket.emit("notif", welcome)

    socket.on("disconnect", () => handleDisconnect(socket));
    on<ChatMsgEvent>(socket, "chat-msg", (payload) => handleChatMessage(toSocketUser(socket.data.user), payload));
    on<{ senderId: string }>(socket, "chat-mark-read", async (payload) => {
      if (typeof payload?.senderId !== "string") return;
      await markConversationAsRead(payload.senderId, userId);
      await sendUnreadMessagesCount(userId);
    });
    on<{ userId: string | null }>(socket, "chat-active-user", (payload) => {
      const activeId = payload?.userId;
      socket.data.activeChatUserId = typeof activeId === "string" ? activeId : null;
    });
    on(socket, "get-chat-users", () => handleUsersInfo(userId));

    try {
      await sendUnreadMessagesCount(userId);
    } catch (err) {
      console.error("Failed to send unread messages count:", err);
    }
  }

  io.use(authUser); // middleware
  io.on("connection", (socket: Socket) => handleConnection(socket));

  return io;
}
