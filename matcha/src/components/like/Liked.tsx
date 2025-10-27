// matcha/src/components/like/Liked.tsx
"use client";

import { useEffect, useState } from "react";
import Browse from "@/components/browse/Browse";
import { PublicUser } from "@/lib/types";

export default function Liked() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  
  async function fetchUsers() {
    try {
      const res = await fetch("/api/match/getLikes");
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
      <Browse users={users} />
    </div>
  );
}