// matcha/src/components/chat/ChatWindow.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { PublicUser, ChatMsgEvent, MAX_MESSAGE_LENGTH, Payload } from "@/lib/types";
import ChatCardUser from "../card-user/ChatCardUser";
import { useMe } from "@/context/UserContext";

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
  const { me } = useMe();
  const meId = me?.id;
  const selectedUserId = selectedUser?.id;
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function send(e?: React.FormEvent | React.KeyboardEvent) {
    e?.preventDefault();

    if (isSendingRef.current || !me || !socket || !selectedUser) return;

    const trimmedMessage = input.trim();
    if (!trimmedMessage) return;

    isSendingRef.current = true;
    setIsSending(true);
    const payload: ChatMsgEvent = {
      to: selectedUser.id,
      msg: trimmedMessage,
    };

    try {
      socket.emit("chat-msg", payload);
      setInput("");
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  useEffect(() => {
    if (!socket || !selectedUser?.id) return;

    socket.emit("chat-mark-read", {
      senderId: selectedUser.id,
    });
  }, [socket, selectedUser?.id]);

  useEffect(() => {
    if (!socket || !selectedUserId) return;

    function handleChatMsg(chatMsg: Payload) {
      const isForCurrentChat =
        chatMsg.from.id === selectedUserId || chatMsg.to.id === selectedUserId;
      if (!isForCurrentChat) return;

      setMessages((prev) => [
        ...prev,
        {
          from: chatMsg.from.id === meId ? "me" : "you",
          text: chatMsg.msg,
        },
      ]);
    }

    socket.on("chat-msg", handleChatMsg);
    return () => {
      socket.off("chat-msg", handleChatMsg);
    };
  }, [socket, selectedUserId, meId]);

  useEffect(() => {
    if (!selectedUserId) return;
    // Ignore the response if the window unmounted in the meantime
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/chat/${selectedUserId}`, {
          method: "GET",
          credentials: "include" });
        // 403: no longer matched (unmatch or block), the history is not readable anymore
        if (!res.ok) {
          if (!cancelled) setMessages([]);
          return;
        }
        const raw: RawMessage[] = await res.json();
        if (cancelled) return;
        setMessages(raw.map((m): Message => ({
          from: m.sender_id === meId ? "me" : "you",
          text: m.message,
        })));
      } catch (err) {
        console.error("Could not retrieve messages:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedUserId, meId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-gray-700 flex gap-2">
        <div>
          <ChatCardUser user={selectedUser}/>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey) && send(e)}
          className="flex-1 bg-gray-800 rounded px-3 py-2 focus:outline-none resize-none"
          autoFocus
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Your message"
          disabled={isSending}
        >
        </textarea>
        <button
          onClick={send}
          className="bg-pink-700 px-4 rounded hover:bg-pink-800"
          disabled={isSending}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
