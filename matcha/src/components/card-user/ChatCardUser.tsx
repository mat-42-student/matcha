// matcha/src/components/card-user/CardUser.tsx

"use client";

import { useEffect, useState } from "react";
import { PublicUser, Picture } from "@/lib/types";
import Image from "next/image";

export default function ChatCardUser({
  user,
 }: { 
  user: PublicUser;
}) {

  const [mainPic, setMainPic] = useState<Picture>({mime_type: "", data: ""});

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
      <span className="text-pink-700 font-semibold p-2 text-right">
        {user.first_name}
        <br/>
        {user.age} 🎂
        <br/>
        {user.fame} ⭐
        <br/>
        {user.city} 🏠
      </span>
    </div>
  );
}