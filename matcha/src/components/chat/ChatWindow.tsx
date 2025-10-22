// matcha/src/components/chat/ChatWindow.tsx
"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { PublicUser, Payload } from "@/lib/types";
import ChatCardUser from "../card-user/ChatCardUser";
import { useUser } from "@/context/UserContext";

type RawMessage = {
  id: number;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string | Date;
};

type Message = { from: "me" | "you"; text: string };

export default function ChatWindow({
  selectedUser,
}: {
  selectedUser: PublicUser | null;
}) {
  const { socket } = useSocket();
  const { me } = useUser();
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [input, setInput] = useState("");



  function send() {
    if (me && socket && selectedUser && input.trim()) {
      const payload: Payload = {
        from: me,
        to: selectedUser,
        msg: input
      }
      socket.emit("chat-msg", payload);
      setInput("");
    }
  }


useEffect(() => {

  function transformMessages(raw: RawMessage[]): Message[] {
    return raw.map((m) => ({
      from: m.sender_id === me?.id ? "me" : "you",
      text: m.message,
    }));
  }

  async function fetchMessages(): Promise<RawMessage[]> {
    if (!selectedUser) return [];
    try {
      const res = await fetch(`/api/chat/${selectedUser?.id}`, { method: "GET", credentials: "include" });
      console.log("fetchMsg", res)
      return await res.json();
    } catch {
      return [];
    }
  }

  (async () => {
    const fetchedMessages = await fetchMessages();
    setMessages(transformMessages(fetchedMessages));
  })();
}, [selectedUser, me]);

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
              className={`p-2 rounded-lg ${
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
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey) && send()}
          className="flex-1 bg-gray-800 rounded px-3 py-2 focus:outline-none resize-none"
          autoFocus
          placeholder="Your message"
        >
        </textarea>
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
