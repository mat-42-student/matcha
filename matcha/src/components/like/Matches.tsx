// matcha/src/components/like/Matches.tsx
"use client";

import { useEffect, useState } from "react";
import Browse from "@/components/browse/Browse";
import { PublicUser } from "@/lib/types";
import { UsersStoreProvider } from "@/context/UsersStore";

export default function LikeMe() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  
  async function fetchUsers() {
    try {
      const res = await fetch('api/match/getMatches')
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

  useEffect(() => { fetchUsers() }, [])

  return (
    <div className="p-4">
      <UsersStoreProvider initialUsers={users}>
        <Browse />
      </UsersStoreProvider>
    </div>
  );
}