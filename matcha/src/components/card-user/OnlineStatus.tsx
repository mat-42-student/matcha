// matcha/src/components/card-user/OnlineStatus.tsx
"use client";

import { useSocket } from "@/context/SocketContext";

/**
 * "Online" while the user has a socket open, otherwise the date of their last connection
 */
export default function OnlineStatus({
  userId,
  lastLogin,
  className = "",
}: {
  userId: string;
  lastLogin?: string | Date | null;
  className?: string;
}) {
  const { onlineUsers, lastSeen } = useSocket();

  if (onlineUsers.includes(userId)) {
    return (
      <span className={`flex items-center gap-1 ${className}`}>
        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="text-green-600 font-medium">Online</span>
      </span>
    );
  }

  const seen = lastSeen[userId] ?? (lastLogin ? new Date(lastLogin) : null);

  return (
    <span className={`flex items-center gap-1 text-gray-500 ${className}`}>
      <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
      {seen
        ? `Last seen ${seen.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
        : "Offline"}
    </span>
  );
}
