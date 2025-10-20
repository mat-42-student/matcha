// matcha/src/components/chat/ChatSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useSocket } from "@/context/SocketContext";
import { PublicUser } from "@/lib/types";

export default function ChatSidebar({
  onSelectUser,
  selectedUser,
}: {
  onSelectUser: (id: string) => void;
  selectedUser: string | null;
}) {
  const { socket, chatUsers } = useSocket();
  const { user } = useUser();
  useEffect(() => {
    if (socket)
      socket.emit("get-chat-users", {
        from: user,
        to: user,
        msg: ""
      }
    );
  }, [socket]);

  if (!chatUsers) return <div>No match</div>;

  return (
    <div className="w-1/6 bg-gray-900 text-gray-200 border-r border-gray-700 overflow-y-auto">
      <div className="p-3 font-semibold text-lg border-b border-gray-700">
        Users
      </div>
      {chatUsers.map((u) => {
        return (
          <div
            key={u.id}
            onClick={() => onSelectUser(u.id)}
            className=
              "cursor-pointer p-3 flex items-center justify-between hover:bg-gray-800"
          >
            <span>{u.first_name} {u.last_name}</span>
            <span className="w-2 h-2 rounded-full"/>
          </div>
        );
      })}
    </div>
  );
}
