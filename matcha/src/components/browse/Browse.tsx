"use client";

import { useEffect, useState } from "react";
import CardUser from "@/components/card-user/CardUser";

export default function Browse() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  async function getUserList() {
    const res = await fetch(`/api/users?page=${page}`);
    const data = await res.json();
    setUsers(data);
  }

  useEffect(() => {getUserList();}, [page]);

  return (
    <div className="h-full overflow-auto p-4">
      <h1 className="text-xl font-bold mb-4">Users – Page {page}</h1>

      <div className="flex flex-wrap justify-center">
        {users.map((u) => (
          <CardUser key={u.username} user={u} />
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Précédent
        </button>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 rounded bg-gray-200"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}