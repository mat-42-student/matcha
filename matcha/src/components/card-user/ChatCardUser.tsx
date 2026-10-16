// matcha/src/components/card-user/CardUser.tsx
"use client";

import { useSocket } from "@/context/SocketContext";
import { PublicUser } from "@/lib/types";
import Image from "next/image";

export default function ChatCardUser({ user }: { user: PublicUser }) {
  const { onlineUsers } = useSocket();

  const isOnline = onlineUsers.includes(user.id);

  return (
    <div className="flex justify-between items-center mb-2 max-w-80">
      <Image
        unoptimized
        width={0}
        height={0}
        className="w-25 h-25 rounded-full object-cover shadow-md border-2 border-pink-500"
        src={`/api/users/${user.id}/pics`}
        alt="profile picture"
      />

      <div className="text-pink-700 font-semibold p-2 text-right">
        <div>{user.first_name}</div>
        <div className="text-xs text-gray-500">@{user.username}</div>
        <div>{user.age} 🎂</div>
        <div>{user.fame} ⭐</div>
        <div>{user.city} 🏠</div>

        <div className="flex items-center justify-end mt-1 text-sm text-gray-600">
          <span
            className={`w-2.5 h-2.5 rounded-full mr-1 ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {isOnline ? (
            <span className="text-green-600 font-medium">connected</span>
          ) : (
            <span className="text-gray-500">
              last login:{" "}
              {user.last_login
                ? new Date(user.last_login).toLocaleString()
                : "unknown"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}