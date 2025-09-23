"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CardUser from "@/components/card-user/CardUser";
import { PublicUser } from "@/types";

export default function Browse() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [page, setPage] = useState(1);
  const router = useRouter();

async function getUserList() {
    try {
      const res = await fetch(`/api/users?page=${page}`);
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
  useEffect(() => {
    getUserList();

    // Affiche la mémoire utilisée côté client
    // if (typeof window !== "undefined" && (window.performance as any).memory) {
    //   const { usedJSHeapSize, totalJSHeapSize } = (window.performance as any).memory;
    //   console.log(
    //     `Heap: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB / ${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
    //   );
    // }
  }, [page]);

  return (
    <div className="h-full p-4">
      {/* <h1 className="text-xl font-bold mb-4">Users – Page {page}</h1> */}

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