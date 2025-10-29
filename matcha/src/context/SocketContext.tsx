// src/context/SocketProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useMe } from "@/context/UserContext";
import toast from "react-hot-toast";
import { Payload, PublicUser, UnreadMessages } from "@/lib/types";
import { ne } from "@faker-js/faker";

interface Notification {
  id: number;
  type: "like" | "match" | "unlike" | "message";
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
  chatUsers: PublicUser[];
  unreadMessages: Map<string, number>;
  notifications: Notification[];
  refreshNotifications: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  chatMsg: null,
  like: null,
  unlike: null,
  match: null,
  chatUsers: [],
  unreadMessages: new Map(),
  notifications: [],
  refreshNotifications: async () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { me } = useMe();
  const [socket, setSocket] = useState<Socket | null>(null); // on veut vraiment tous ces null ?
  const [chatMsg, setChatMsg] = useState<Payload | null>(null);
  const [like, setLike] = useState<Payload | null>(null);
  const [unlike, setUnlike] = useState<Payload | null>(null);
  const [match, setMatch] = useState<Payload | null>(null);
  const [chatUsers, setChatUsers] = useState<PublicUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(new Map());

  // --- 🔁 Fetch notifications from your API ---
  const fetchNotifications = useCallback(async () => {
    if (!me) return;
    try {
      const res = await fetch(`/api/me/notifications`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      console.log("fetche notifications called for" + me.first_name);
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [me]);

  async function handleNotif(payload: Payload) {
    if (payload.msg === "like")
      toast(payload.from.first_name + " liked you !");
    else if (payload.msg === "unlike")
      toast(payload.from.first_name + " unliked you !");
    else if (payload.msg === "match")
      toast(payload.from.first_name + " matched you !");
    else if (payload.msg === "message")
      toast(payload.from.first_name + " messaged you !");   
    else {
      toast.success(payload.msg);
      return;
    }
    await fetchNotifications();
  }

  function handleChatUnreadMessages(payload: UnreadMessages[]) {
    setUnreadMessages(prevUnreadMap => {
      const newMap = new Map(prevUnreadMap);
      for (const p of payload) {
        newMap.set(p.sender_id, p.unread_count);
      }
      return newMap;
    });
  }

  useEffect(() => {
    if (!me) {
      if (socket) {
        socket.disconnect();
        toast.success("Bye");
        setSocket(null);
        setNotifications([]);
      }
      return;
    }

    const s = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    console.log("🔌 Socket connected");
    setSocket(s);

    // Setup listeners
    s.on("notif", (payload: Payload) => handleNotif(payload));
    s.on("like", (payload: Payload) => setLike(payload));
    s.on("match", (payload: Payload) => setMatch(payload));
    s.on("unlike", (payload: Payload) => setUnlike(payload));
    s.on("chat-msg", (payload: Payload) => setChatMsg(payload));
    s.on("chat-unread-count", (payload: UnreadMessages[]) => handleChatUnreadMessages(payload));
    s.on("chat-users", setChatUsers);

    // Initial notifications fetch
    fetchNotifications();

    return () => {
      s.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, fetchNotifications]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        like,
        unlike,
        match,
        chatMsg,
        chatUsers,
        unreadMessages,
        notifications,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}