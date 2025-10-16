// src/context/SocketProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@/context/UserContext";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      // Si l'utilisateur est déconnecté, on ferme la socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Quand un user apparaît, on ouvre la connexion WS
    const s = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    console.log("ouverture de la socket")
    setSocket(s);

    s.on("connect", () => console.log("✅ Socket connected:", s.id));
    s.on("disconnect", () => console.log("❌ Socket disconnected"));

    return () => {
      s.disconnect();
    };
  }, [user]); // 🔥 déclenché quand le user change

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
