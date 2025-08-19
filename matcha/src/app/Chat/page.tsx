"use client";

import { useEffect, useState } from "react";
import { socket } from "../../socket";

export default function Chat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // gestion connexion
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // gestion messages
    socket.on("chat-message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("chat-message");
    };
  }, []);

  const send = () => {
    if (input.trim()) {
      socket.emit("chat-message", input);
      setInput("");
    }
  };

  return (
    <div>
      <h1>Chat Test {isConnected ? "✅" : "❌"}</h1>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border-cyan-100"
      />
      <button onClick={send}>Send</button>
    </div>
  );
}