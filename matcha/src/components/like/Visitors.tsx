// matcha/src/components/like/Visitors.tsx
"use client";

import { useEffect, useState } from "react";
import Browse from "@/components/browse/Browse";
import { PublicUser } from "@/lib/types";

export default function Visitors() {
  const [users, setUsers] = useState<PublicUser[]>([]);

  async function fetchUsers() {
    const res = await fetch("/api/match/getViews");
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