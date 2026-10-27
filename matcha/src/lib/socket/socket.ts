// matcha/src/server/socket.ts

import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
// @ts-expect-error -- cookie comes with socket.io and ships without type declarations
import cookie from "cookie";
import { getSessionExpiry, getSessionUser } from "@/lib/db/session";
import { ChatMsgEvent, PresencePayload, PublicUser, SocketUser, UserHiddenPayload } from "@/lib/types";
import { handleChatMessage, handleUsersInfo, sendUnreadMessagesCount } from "./chat";
import { updateLastLogin } from "../db/users";
import { getMatchIds, markConversationAsRead } from "../db/chat";
import { isValidUuid } from "../validators/serverValidator";

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


/***
 * Strip a user down to what other users may see through sockets
 */
export function toSocketUser(user: Pick<PublicUser, "id" | "first_name">): SocketUser {
  return { id: user.id, first_name: user.first_name };
}

/***
 * Register a socket event handler, catching errors so a bad payload or a DB error cannot crash the server.
 * When the client asks for an acknowledgement, it receives the handler's result
 * (or a generic error if the handler threw).
 */
function on<T>(socket: Socket, event: string, handler: (payload: T) => unknown) {
  socket.on(event, async (payload: T, ack?: (result: unknown) => void) => {
    // the ack comes from the client: make sure it really is one
    const reply = typeof ack === "function" ? ack : () => {};
    try {
      reply((await handler(payload)) ?? null);
    } catch (err) {
      console.error(`Socket handler "${event}" failed:`, err);
      reply({ ok: false, error: "Server error" });
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
 * Push a block to every tab of both users, silently: their clients remove the other user from
 * their lists, then reload the chat list and the notifications (removed by the block).
 * The event does not say "block": the blocked user is never told why the blocker disappeared.
 */
export function sendBlock(blockerId: string, blockedId: string) {
  send<UserHiddenPayload>(blockedId, "user-hidden", { userId: blockerId });
  send<UserHiddenPayload>(blockerId, "user-hidden", { userId: blockedId });
}

/***
 * Close the sockets of a session that just ended (logout), or of every session of the user
 * (password reset). Auth only runs at the handshake: without this, they keep sending and receiving.
 * The client sees an "io server disconnect" and goes back to the login page.
 */
export function closeSessionSockets(userId: string, sessionId?: string) {
  // copy: each disconnect removes the socket from the registry
  for (const socket of [...(connectedUsers.get(userId) ?? [])]) {
    if (!sessionId || socket.data.sessionId === sessionId) socket.disconnect(true);
  }
}

/***
 * Close the sockets of every session of the user but keepSessionId (password change)
 */
export function closeOtherSessionSockets(userId: string, keepSessionId: string) {
  // copy: each disconnect removes the socket from the registry
  for (const socket of [...(connectedUsers.get(userId) ?? [])]) {
    if (socket.data.sessionId !== keepSessionId) socket.disconnect(true);
  }
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
  // Only the site itself may open a socket with the user's cookie (cross-site WebSocket hijacking).
  // Fails closed: without NEXT_PUBLIC_BASE_URL (.env), no browser can connect.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const allowedOrigin = baseUrl ? new URL(baseUrl).origin : false;

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // cors only covers HTTP polling: the WebSocket handshake has to be checked here.
    // Browsers always send an Origin; a request without one does not come from a web page.
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      callback(null, !origin || origin === allowedOrigin);
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
      const [user, expiresAt] = await Promise.all([getSessionUser(sessionId), getSessionExpiry(sessionId)]);
      if (!user || !expiresAt) return next(new Error("unauthorized"));

      // Comes from the my_profile view (no password, but contains the email): never forward it as-is to other users
      socket.data.user = user;
      socket.data.sessionId = sessionId;
      socket.data.expiresAt = expiresAt;
      next();
    } catch (err) {
      console.error("Socket auth failed:", err);
      // not "unauthorized": the client retries instead of ending the session
      next(new Error("server error"));
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

    // Close the socket when its session expires (setTimeout delays are capped at 2^31 - 1 ms, ~24 days)
    const expiry = setTimeout(
      () => socket.disconnect(true),
      Math.min((socket.data.expiresAt as Date).getTime() - Date.now(), 2 ** 31 - 1)
    );

    socket.on("disconnect", () => {
      clearTimeout(expiry);
      handleDisconnect(socket);
    });
    on<ChatMsgEvent>(socket, "chat-msg", (payload) => handleChatMessage(toSocketUser(socket.data.user), payload));
    on<{ senderId: string }>(socket, "chat-mark-read", async (payload) => {
      if (typeof payload?.senderId !== "string" || !isValidUuid(payload.senderId)) return;
      // every tab of the user reloads its bell, not only the one reading
      if (await markConversationAsRead(payload.senderId, userId)) send(userId, "notifications-changed", null);
      await sendUnreadMessagesCount(userId);
    });
    on<{ userId: string | null }>(socket, "chat-active-user", (payload) => {
      const activeId = payload?.userId;
      socket.data.activeChatUserId = typeof activeId === "string" && isValidUuid(activeId) ? activeId : null;
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
