// matcha/src/components/like/Liked.tsx
"use client";

import { useEffect, useState } from "react";
import Browse from "@/components/browse/Browse";
import { PublicUser } from "@/types";

export default function Liked() {
  const [users, setUsers] = useState<PublicUser[]>([]);

  async function fetchUsers() {
    const res = await fetch("/api/match/getLikes");
    const data = await res.json();
    setUsers(data);
  }
  useEffect(() => { fetchUsers() }, []);

  return (
    <div className="p-4">
      <Browse users={users} refreshList={fetchUsers}/>
    </div>
  );
}