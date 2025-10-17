// src/context/SocketProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import { Payload } from "@/types";
import { PublicUser } from "@/types";

interface SocketContextType {
  socket: Socket | null;
}

interface SocketContextType {
  socket: Socket | null;
  chatMsg: Payload | null;
  like: Payload | null;
  unlike: Payload | null;
  match: Payload | null;
  chatUsers: PublicUser[] | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  chatMsg: null,
  like: null,
  unlike: null,
  match: null,
  chatUsers: null,
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMsg, setChatMsg] = useState<Payload | null>(null);
  const [like, setLike] = useState<Payload | null>(null);
  const [unlike, setUnlike] = useState<Payload | null>(null);
  const [match, setMatch] = useState<Payload | null>(null);
  const [chatUsers, setChatUsers] = useState<PublicUser[]| null>(null);

  function handleNotif(payload: Payload) {
    toast.success(/*payload.from.first_name + ": " + */payload.msg);
  }  
  
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        toast.success("Bye");
        setSocket(null);
      }
      return;
    }

    const s = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    console.log("ouverture de la socket")
    setSocket(s);

    s.on("notif", (payload: Payload) => handleNotif(payload));
    s.on("like", (payload: Payload) => setLike(payload));
    s.on("match", (payload: Payload) => setMatch(payload));
    s.on("unlike", (payload: Payload) => setUnlike(payload));
    s.on("chat-msg", (payload: Payload) => { console.log(payload); setChatMsg(payload) });
    s.on("chat-users", setChatUsers);

    return () => {
      s.disconnect()
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, like, unlike, match, chatMsg, chatUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
