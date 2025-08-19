"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function Chat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Ici window existe
    const s = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    setSocket(s);

    s.on("chat-message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const send = () => {
    if (socket && input.trim()) {
      socket.emit("chat-message", input);
      setInput("");
    }
  };

  return (
    <div>
      <h1>Chat Test</h1>
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



// "use client";

// import { useEffect, useState } from "react";
// import { io } from "socket.io-client";

// const socket = io({
//   path: "/socket.io",
//   transports: ["websocket", "polling"], // socket.io bascule si websocket échoue
//   secure: true,
//   withCredentials: true
// });

// export default function Home() {
//   const [messages, setMessages] = useState<string[]>([]);
//   const [input, setInput] = useState("");

//   useEffect(() => {
//     socket.on("chat-message", (msg: string) => {
//       setMessages((prev) => [...prev, msg]);
//     });
//   }, []);

//   const send = () => {
//     socket.emit("chat-message", input);
//     setInput("");
//   };

//   return (
//     <div>
//       <h1>Chat Test</h1>
//       <ul>
//         {messages.map((m, i) => (
//           <li key={i}>{m}</li>
//         ))}
//       </ul>
//       <input value={input} onChange={(e) => setInput(e.target.value)} className="border-cyan-100"/>
//       <button onClick={send}>Send</button>
//     </div>
//   );
// }
