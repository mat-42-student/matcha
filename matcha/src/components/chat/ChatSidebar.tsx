// matcha/src/components/chat/ChatSidebar.tsx
"use client";

import { Socket } from "socket.io-client";

export default function ChatSidebar({
  s,
  onSelectUser,
  selectedUser,
}: {
  s: Socket;
  onSelectUser: (id: string) => void;
  selectedUser: string | null;
}) {
  s.send({})
  const matches = [
    { id: "u1", username: "Alice" },
    { id: "u2", username: "Bob" },
    { id: "u3", username: "Charlie" },
  ];
  return (
    <div className="w-1/6 bg-gray-900 text-gray-200 border-r border-gray-700 overflow-y-auto">
      <div className="p-3 font-semibold text-lg border-b border-gray-700">
        Utilisateurs
      </div>
      {matches.map((u) => {
        return (
          <div
            key={u.id}
            onClick={() => onSelectUser(u.id)}
            className=
              "cursor-pointer p-3 flex items-center justify-between hover:bg-gray-800"
          >
            <span>{u.username}</span>
            <span className="w-2 h-2 rounded-full"/>
          </div>
        );
      })}
    </div>
  );
}
