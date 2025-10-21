// matcha/src/components/chat/MainChat.tsx
"use client";

import { useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { PublicUser } from "@/lib/types";

export default function MainChat() {
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  return (
    <div className="flex h-full">
      <ChatSidebar onSelectUser={setSelectedUser} />
      <ChatWindow selectedUser={selectedUser} />
    </div>
  );
}