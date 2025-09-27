"use client";

import { useState } from "react";
import CardUser from "@/components/card-user/CardUser";
import { PublicUser } from "@/types";

export default function Browse( { users }: { users: PublicUser[] } ) {
  const [page, setPage] = useState(1);
  const perPage = 12;

  const totalPages = Math.ceil(users.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentUsers = users.slice(startIndex, startIndex + perPage);

  if (users.length === 0)
    return <div className="p-4">No results</div>

  return (
    <div className="p-4">
      <div className="flex flex-wrap justify-center">
        {currentUsers.map((u) => (
          <CardUser key={u.username} user={u} />
        ))}
      </div>

      {users.length > perPage && (
        <div className="flex gap-2 mt-4 justify-center">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-pink-700 disabled:opacity-50 shadow-md hover:bg-pink-800"
          >
            ←
          </button>

          <span className="px-2 py-1">
            Page {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => (p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-pink-700 disabled:opacity-50 shadow-md hover:bg-pink-800"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
