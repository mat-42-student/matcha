// matcha/src/components/card-user/OnlineStatus.tsx
"use client";

import { useSocket } from "@/context/SocketContext";

/**
 * "Online" while a match has a socket open, otherwise the date of their last connection.
 * Renders nothing for a user who is not a match: online status is only shared between matches.
 */
export default function OnlineStatus({
  userId,
  className = "",
}: {
  userId: string;
  className?: string;
}) {
  const { chatUsers, onlineUsers, lastSeen } = useSocket();

  const match = chatUsers.find((u) => u.id === userId);
  if (!match) return null;

  if (onlineUsers.includes(userId)) {
    return (
      <span className={`flex items-center gap-1 ${className}`}>
        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="text-green-600 font-medium">Online</span>
      </span>
    );
  }

  const seen = lastSeen[userId] ?? (match.last_login ? new Date(match.last_login) : null);

  return (
    <span className={`flex items-center gap-1 text-gray-500 ${className}`}>
      <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
      {seen
        ? `Last seen ${seen.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
        : "Offline"}
    </span>
  );
}
