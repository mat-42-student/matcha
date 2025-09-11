"use client";

import { useEffect, useState } from "react";
import CardUser from "@/components/card-user/CardUser";

export default function Homepage() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/users?page=${page}`);
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    };
    load();
  }, [page]);

  return (
    // Étend la hauteur du <main> (qui est déjà "flex-1 overflow-hidden")
    <div className="h-full overflow-auto p-4">
      <h1 className="text-xl font-bold mb-4">Users – Page {page}</h1>

      {loading && <p>Chargement...</p>}

      <div className="flex flex-wrap justify-center gap-4">
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