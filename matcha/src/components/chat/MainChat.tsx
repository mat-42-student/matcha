// matcha/src/components/chat/MainChat.tsx
"use client";

import { useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";

export default function MainChat() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  return (
    <div className="flex h-full">
      <ChatSidebar onSelectUser={setSelectedUser} selectedUser={selectedUser} />
      <ChatWindow selectedUser={selectedUser} />
    </div>
  );
}