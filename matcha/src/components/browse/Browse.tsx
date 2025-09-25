"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CardUser from "@/components/card-user/CardUser";
import { PublicUser } from "@/types";

export default function Browse() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [page, setPage] = useState(1);
  const [userCount, setUserCount] = useState<number>(0);
  const router = useRouter();

async function fetchUserCount() {
  try {
    const res = await fetch(`/api/users/count`);
    if (!res.ok) {
      console.log(`API Error: ${res.status}`);
      return;
    }
    const data = await res.json();
    return data[0].count;
  } catch (err) {
    console.error("Could not retrieve user count:", err);
  }
}

async function getUserList() {
    try {
      const count = await fetchUserCount();
      if (!count) 
        return;
      setUserCount(count);

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
    <div className="p-4">
      <div className="flex flex-wrap justify-center">
        {users.map((u) => (
          <CardUser key={u.username} user={u} />
        ))}
      </div>

      <div className="flex gap-2 mt-4 justify-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-pink-600 disabled:opacity-50"
        >
          Précédent
        </button>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 rounded bg-pink-600 disabled:opacity-50"
          disabled={userCount !== null && page * 12 >= userCount - 1}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}