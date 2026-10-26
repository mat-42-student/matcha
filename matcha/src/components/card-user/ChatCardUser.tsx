// matcha/src/components/card-user/CardUser.tsx
"use client";

import { PublicUser } from "@/lib/types";
import Image from "next/image";
import OnlineStatus from "./OnlineStatus";

export default function ChatCardUser({ user }: { user: PublicUser }) {
  return (
    <div className="flex justify-between items-center mb-2 max-w-80">
      <Image
        unoptimized
        width={0}
        height={0}
        className="w-25 h-25 rounded-full object-cover shadow-md border-2 border-pink-500"
        src={`/api/users/${user.id}/pics`}
        alt="profile picture"
        loading="eager"
      />

      <div className="text-pink-700 font-semibold p-2 text-right">
        <div>{user.first_name}</div>
        <div className="text-xs text-gray-500">@{user.username}</div>
        <div>{user.age} 🎂</div>
        <div>{user.fame} ⭐</div>
        <div>{user.city} 🏠</div>

        <OnlineStatus userId={user.id} className="justify-end mt-1 text-sm" />
      </div>
    </div>
  );
}