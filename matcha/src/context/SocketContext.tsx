"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useMe } from "@/context/UserContext";
import toast from "react-hot-toast";
import { Payload, PublicUser, RelationChangedPayload, UnreadMessages } from "@/lib/types";

interface Notification {
  id: number;
  type: "like" | "match" | "unlike" | "message" | "view";
  message: string;
  sender_username?: string;
  sender_picture?: string;
  created_at: string;
}

interface SocketContextType {
  socket: Socket | null;
  chatMsg: Payload | null;
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
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  chatMsg: null,
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
  onlineUsers: [],
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { me } = useMe();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMsg, setChatMsg] = useState<Payload | null>(null);
  const [like, setLike] = useState<Payload | null>(null);
  const [unlike, setUnlike] = useState<Payload | null>(null);
  const [match, setMatch] = useState<Payload | null>(null);
  const [relationChanged, setRelationChanged] = useState<RelationChangedPayload | null>(null);
  const [chatUsers, setChatUsers] = useState<PublicUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!me) return;
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
  }, [me]);

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

  const handleNotif = useCallback(async (payload: Payload) => {
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

  useEffect(() => {
    if (!me) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setNotifications([]);
        setOnlineUsers([]);
        toast.success("Bye 👋");
      }
      return;
    }

    const s = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.on("notif", handleNotif);
    s.on("like", setLike);
    s.on("match", setMatch);
    s.on("unlike", setUnlike);
    s.on("relation-changed", setRelationChanged);
    s.on("chat-msg", setChatMsg);
    s.on("chat-unread-count", handleChatUnreadMessages);
    s.on("chat-users", setChatUsers);

    s.on("online-users", (ids: string[]) => {
      setOnlineUsers(ids);
    });

    fetchNotifications();

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, [me, fetchNotifications, handleNotif, handleChatUnreadMessages]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        like,
        unlike,
        match,
        relationChanged,
        chatMsg,
        chatUsers,
        unreadMessages,
        setUnreadMessages,
        notifications,
        refreshNotifications: fetchNotifications,
        removeNotification,
        onlineUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}