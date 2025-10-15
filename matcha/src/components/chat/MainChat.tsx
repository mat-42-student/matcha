// matcha/src/components/chat/MainChat.tsx

"use client";

import { useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useSocket } from "@/context/SocketContext";

export default function MainChat() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { socket } = useSocket()

  if (!socket) return <div>Socket error</div>;
  console.log(socket);
  return (
    <>
      <ChatSidebar s={socket} onSelectUser={setSelectedUser} selectedUser={selectedUser} />
      <ChatWindow selectedUser={selectedUser} />
    </>
  );
}