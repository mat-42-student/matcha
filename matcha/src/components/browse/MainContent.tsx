// matcha/src/components/browse/MainContent.tsx

"use client";

import { PublicUser } from "@/lib/types";
import Browse from "@/components/browse/Browse";
import { useState, useEffect } from "react";
import { UsersStoreProvider } from "@/context/UsersStore";

export default function MainContent() {
  const [users, setUsers] = useState<PublicUser[]>([]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users/compatible");
      if (!res.ok) {
        console.error("Failed to fetch users:", res.statusText);
        return;
      }
      const data: PublicUser[] = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error:", err);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <UsersStoreProvider initialUsers={users}>
      <Browse />
    </UsersStoreProvider>
  );
}