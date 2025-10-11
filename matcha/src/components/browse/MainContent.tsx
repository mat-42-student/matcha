"use client";

import { PublicUser } from "@/types";
import Browse from "@/components/browse/Browse";
import { useState, useEffect } from "react";

export default function MainContent() {

  const [users, setUsers] = useState<PublicUser[]>([]);

  async function refreshList() {
    try {
      const res = await fetch("/api/users/compatible");
      if (!res.ok) {
        console.error("Failed to fetch users:", res.statusText);
        return [];
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error:", err);
      return <div>Erreur serveur</div>;
    }
  }

  useEffect(() => { refreshList() }, [users]);

  return <Browse users={users} refreshList={refreshList}/>;

}
