"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useMe } from "@/context/UserContext";
import toast from "react-hot-toast";
import { Notification, NotifPayload, Payload, PresencePayload, PublicUser, RelationChangedPayload, UnreadMessages } from "@/lib/types";

interface SocketContextType {
  socket: Socket | null;
  like: Payload | null;
  unlike: Payload | null;
  match: Payload | null;
  relationChanged: RelationChangedPayload | null;
  chatUsers: PublicUser[];
  unreadMessages: Map<string, number>;
  setUnreadMessages: React.Dispatch<React.SetStateAction<Map<string, number>>>;
  notifications: Notification[];
  refreshNotifications: () => Promise<void>;
  removeNotification: (notificationId: number) => Promise<void>;
  clearNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  clearUnreadForUser: (userId: string) => void;
  // matches only: the server never tells anyone else
  onlineUsers: string[];
  // matches seen going offline since the page loaded: fresher than the last_login loaded with them
  lastSeen: Record<string, Date>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  like: null,
  unlike: null,
  match: null,
  relationChanged: null,
  chatUsers: [],
  unreadMessages: new Map(),
  setUnreadMessages: () => {},
  notifications: [],
  refreshNotifications: async () => {},
  removeNotification: async () => {},
  clearNotifications: async () => {},
  markNotificationsRead: async () => {},
  clearUnreadForUser: () => {},
  onlineUsers: [],
  lastSeen: {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { me } = useMe();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [like, setLike] = useState<Payload | null>(null);
  const [unlike, setUnlike] = useState<Payload | null>(null);
  const [match, setMatch] = useState<Payload | null>(null);
  const [relationChanged, setRelationChanged] = useState<RelationChangedPayload | null>(null);
  const [chatUsers, setChatUsers] = useState<PublicUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [lastSeen, setLastSeen] = useState<Record<string, Date>>({});
  // Depend on the id only: updating the profile must not reconnect the socket
  const meId = me?.id;

  const fetchNotifications = useCallback(async () => {
    if (!meId) return;
    try {
      const res = await fetch(`/api/me/notifications`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [meId]);

  const removeNotification = useCallback(async (notificationId: number) => {
    try {
      const res = await fetch(`/api/me/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete notification");
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
      throw err;
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    const res = await fetch(`/api/me/notifications`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete notifications");
    setNotifications([]);
  }, []);

  // Bell opened: everything shown is read, here and (through the server) in the other tabs
  const markNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    const upTo = Math.max(...unread.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => (n.id <= upTo ? { ...n, is_read: true } : n)));
    try {
      const res = await fetch(`/api/me/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upTo }),
      });
      if (!res.ok) throw new Error("Failed to mark notifications as read");
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      await fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  const handleNotif = useCallback(async (payload: NotifPayload) => {
    switch (payload.msg) {
      case "like":
        toast(payload.from.first_name + " liked you !");
        break;
      case "view":
        toast(payload.from.first_name + " viewed your profile !");
        break;
      case "unlike":
        toast(payload.from.first_name + " unliked you !");
        break;
      case "match":
        toast(payload.from.first_name + " matched you !");
        break;
      case "message":
        toast(payload.from.first_name + " messaged you !");
        break;
      default:
        toast.success(payload.msg);
        break;
    }
    await fetchNotifications();
  }, [fetchNotifications]);

  const handleChatUnreadMessages = useCallback((payload: UnreadMessages[]) => {
    setUnreadMessages(prev => {
      const map = new Map(prev);
      for (const p of payload) map.set(p.sender_id, Number(p.unread_count));
      return map;
    });
  }, []);

  const clearUnreadForUser = useCallback((userId: string) => {
    setUnreadMessages((prev) => {
      if (!prev.has(userId)) return prev;

      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const handleChatUsers = useCallback((users: PublicUser[]) => {
    setChatUsers(users);

    // Drop unread counters of users we can no longer chat with
    const activeChatIds = new Set(users.map((user) => user.id));
    setUnreadMessages((prev) => {
      const next = new Map<string, number>();
      for (const [userId, count] of prev.entries()) {
        if (activeChatIds.has(userId) && count > 0) {
          next.set(userId, count);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!meId) return;

    const s = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    // Expose the socket once connected (same object on reconnect, so no extra render)
    // and (re)load notifications and matches with their online status,
    // which also catches up on what was missed while disconnected
    s.on("connect", () => {
      setSocket(s);
      fetchNotifications();
      s.emit("get-chat-users");
    });
    s.on("notif", handleNotif);
    // a notification was removed or read server side (in any tab)
    s.on("notifications-changed", fetchNotifications);
    s.on("like", setLike);
    s.on("match", setMatch);
    s.on("unlike", setUnlike);
    s.on("relation-changed", (payload: RelationChangedPayload) => {
      setRelationChanged(payload);
      if (
        payload.likeStatus === "match" ||
        payload.likeStatus === "none" ||
        payload.likeStatus === "block"
      ) {
        s.emit("get-chat-users");
        fetchNotifications();
      }
    });
    s.on("chat-unread-count", handleChatUnreadMessages);
    s.on("chat-users", handleChatUsers);

    // Full list of online matches, sent along with chat-users
    s.on("online-users", setOnlineUsers);
    // A match connected or disconnected (then last seen now)
    s.on("presence", ({ userId, online }: PresencePayload) => {
      setOnlineUsers((prev) => {
        const others = prev.filter((id) => id !== userId);
        return online ? [...others, userId] : others;
      });
      if (!online) setLastSeen((prev) => ({ ...prev, [userId]: new Date() }));
    });

    // Runs on logout (meId becomes undefined) and on unmount
    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setNotifications([]);
      setOnlineUsers([]);
      setLastSeen({});
    };
  }, [meId, fetchNotifications, handleNotif, handleChatUnreadMessages, handleChatUsers]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        like,
        unlike,
        match,
        relationChanged,
        chatUsers,
        unreadMessages,
        setUnreadMessages,
        clearUnreadForUser,
        notifications,
        refreshNotifications: fetchNotifications,
        removeNotification,
        clearNotifications,
        markNotificationsRead,
        onlineUsers,
        lastSeen,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}