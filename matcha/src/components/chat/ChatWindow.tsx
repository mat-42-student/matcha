// matcha/src/components/chat/ChatWindow.tsx
"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { Socket } from "socket.io-client";
import { PublicUser } from "@/lib/types";
import ChatCardUser from "../card-user/ChatCardUser";

export default function ChatWindow({
  selectedUser,
}: {
  selectedUser: PublicUser | null;
}) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  const send = () => {
    if (socket && selectedUser && input.trim()) {
      socket.emit("chat:send", { to: selectedUser, text: input });
      setMessages((p) => [...p, { from: "me", text: input }]);
      setInput("");
    }
  };

  if (!selectedUser)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a user
      </div>
    );

  return (
    <div className="flex-1 flex flex-col bg-gray-950 text-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.from === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs p-2 rounded-lg ${
                m.from === "me" ? "bg-pink-700" : "bg-gray-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-700 flex gap-2">
        <div>
          <ChatCardUser user={selectedUser}/>
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 bg-gray-800 rounded px-3 py-2 focus:outline-none"
          placeholder="Your message"
        />
        <button
          onClick={send}
          className="bg-pink-700 px-4 rounded hover:bg-pink-800"
        >
          Send
        </button>
      </div>
    </div>
  );
}
