// matcha/src/components/card-user/CardUser.tsx
"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { PublicUser, Picture } from "@/lib/types";
import Image from "next/image";

export default function ChatCardUser({ user }: { user: PublicUser }) {
  const [mainPic, setMainPic] = useState<Picture>({ mime_type: "", data: "" });
  const { onlineUsers } = useSocket();

  const isOnline = onlineUsers.includes(user.id);

  useEffect(() => {
    async function fetchMainPic() {
      try {
        const res = await fetch(`/api/users/${user.id}/pics/`);
        if (!res.ok || res.status === 204) return;

        const picJson: Picture = await res.json();
        const imageUrl = `data:${picJson.mime_type};base64,${picJson.data}`;
        setMainPic({ ...picJson, data: imageUrl });
      } catch (err) {
        console.error("Could not retrieve main picture:", err);
      }
    }

    fetchMainPic();
  }, [user.id]);

  return (
    <div className="flex justify-between items-center mb-2 max-w-80">
      {mainPic.data ? (
        <Image
          unoptimized
          width={0}
          height={0}
          className="w-25 h-25 rounded-full object-cover shadow-md border-2 border-pink-500"
          src={mainPic.data}
          alt="profile picture"
        />
      ) : (
        <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded shadow-md">
          <span className="text-gray-500 text-sm">No photo</span>
        </div>
      )}

      <div className="text-pink-700 font-semibold p-2 text-right">
        <div>{user.first_name}</div>
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