"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://localhost:8443", {
  path: "/socket.io",
  transports: ["websocket", "polling"], // socket.io bascule si websocket échoue
  secure: true,
  withCredentials: true
});

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.on("chat-message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });
  }, []);

  const send = () => {
    socket.emit("chat-message", input);
    setInput("");
  };

  return (
    <div>
      <h1>Chat Test</h1>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
      <input value={input} onChange={(e) => setInput(e.target.value)} className="border-cyan-100"/>
      <button onClick={send}>Send</button>
    </div>
  );
}
