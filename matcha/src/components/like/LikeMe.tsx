// matcha/src/components/like/LikeMe.tsx
"use client";

import { useEffect, useState } from "react";
import Browse from "@/components/browse/Browse";
import { PublicUser } from "@/types";

export default function LikeMe() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  
  async function fetchLikeMe() {
    try {
      const res = await fetch('api/match/getLikeMe')
      if (!res.ok) {
        console.log(`API Error: ${res.status}`);
        return;
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Could not retrieve users :", err);
    }
  }

  useEffect(() => { fetchLikeMe() }, [])

  return (
    <div className="p-4">
      <Browse users={users} refreshList={fetchLikeMe}/>
    </div>
  );
}