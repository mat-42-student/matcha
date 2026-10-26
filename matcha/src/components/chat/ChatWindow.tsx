// matcha/src/components/chat/ChatWindow.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { PublicUser, ChatMsgEvent, MAX_MESSAGE_LENGTH, Payload } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import ChatCardUser from "../card-user/ChatCardUser";
import OnlineStatus from "../card-user/OnlineStatus";
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
  onBack,
}: {
  selectedUser: PublicUser | null;
  onBack: () => void;
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

  // Tell the server which conversation is open (its messages are then marked read instead of notified)
  // and mark it read
  useEffect(() => {
    if (!socket || !selectedUserId) return;

    const openConversation = () => {
      socket.emit("chat-active-user", { userId: selectedUserId });
      socket.emit("chat-mark-read", { senderId: selectedUserId });
    };

    openConversation();
    // Same client socket on reconnect, but a new one server side that forgot the open conversation,
    // and messages received while disconnected are unread
    socket.on("connect", openConversation);
    return () => {
      socket.off("connect", openConversation);
      socket.emit("chat-active-user", { userId: null });
    };
  }, [socket, selectedUserId]);

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
    if (!socket || !selectedUserId) return;
    // Ignore the response if the window unmounted in the meantime
    let cancelled = false;

    async function loadHistory() {
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
    }

    loadHistory();
    // Messages sent while disconnected were never pushed: reload the history on reconnect
    socket.on("connect", loadHistory);
    return () => {
      cancelled = true;
      socket.off("connect", loadHistory);
    };
  }, [socket, selectedUserId, meId]);

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
      {/* Mobile only: the user list is hidden while a conversation is open */}
      <div className="md:hidden flex items-center gap-3 p-3 border-b border-gray-700">
        <button onClick={onBack} className="p-1 rounded hover:bg-gray-800" aria-label="Back to the user list">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="font-semibold text-pink-500">{selectedUser.first_name}</div>
          <OnlineStatus userId={selectedUser.id} className="text-xs" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.from === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-2 rounded-lg max-w-[80%] wrap-anywhere ${
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
        <div className="hidden md:block">
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
