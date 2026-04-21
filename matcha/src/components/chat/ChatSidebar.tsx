// matcha/src/components/chat/ChatSidebar.tsx

"use client";

import { useEffect } from "react";
import { useMe } from "@/context/UserContext";
import { useSocket } from "@/context/SocketContext";
import { PublicUser } from "@/lib/types";

export default function ChatSidebar({
  onSelectUser,
}: {
  onSelectUser: (user: PublicUser) => void;
}) {
  const { socket, chatUsers, unreadMessages, setUnreadMessages, onlineUsers } = useSocket();
  const { me } = useMe();

  useEffect(() => {
    if (socket) {
      socket.emit("get-chat-users", {
        from: me,
        to: me,
        msg: ""
      });
    }
  }, [socket, me]);

  function handleSelectUser(user: PublicUser) {
    socket?.emit("chat-mark-read", {
      senderId: user.id,
    });

    setUnreadMessages((prev) => {
      const newMap = new Map(prev);
      newMap.set(user.id, 0);
      return newMap;
    });
    onSelectUser(user);
  }

  if (!chatUsers) return <div>No match</div>;

  return (
    <div className="w-1/6 bg-gray-900 text-gray-200 border-r border-gray-700 overflow-y-auto">
      <div className="p-3 font-semibold text-lg border-b border-gray-700">
        Users
      </div>

      {chatUsers.map((u) => {
        const unread = unreadMessages.get(u.id) || 0;
        const isOnline = onlineUsers?.includes(u.id);

        return (
          <div
            key={u.id}
            onClick={() => handleSelectUser(u)}
            className="cursor-pointer p-3 flex items-center justify-between hover:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              {/* Voyant de statut (vert si connecté, gris sinon) */}
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-gray-500"
                }`}
              ></span>

              <span>{u.first_name} {u.last_name}</span>
            </div>

            {unread > 0 && (
              <span className="w-4 h-4 text-xs rounded-full bg-pink-500 flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}