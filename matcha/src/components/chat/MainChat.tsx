// matcha/src/components/chat/MainChat.tsx
"use client";

import { useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useSocket } from "@/context/SocketContext";
import { PublicUser } from "@/lib/types";

export default function MainChat() {
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const { chatUsers } = useSocket();
  // Close the conversation once the user leaves the chat list (unmatch or block, pushed in real time)
  const activeUser = chatUsers.some((u) => u.id === selectedUser?.id) ? selectedUser : null;

  return (
    <div className="flex h-full">
      <ChatSidebar onSelectUser={setSelectedUser} />
      {/* key: a new conversation starts with a fresh window instead of clearing the old one */}
      <ChatWindow key={activeUser?.id} selectedUser={activeUser} />
    </div>
  );
}