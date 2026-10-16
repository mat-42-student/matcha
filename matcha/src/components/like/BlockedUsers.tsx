"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import type { BlockedUser } from "@/lib/types";

export default function BlockedUsers() {
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBlocked() {
      try {
        const res = await fetch("/api/me/blocks");
        if (!res.ok) throw new Error("Network error");
        const data: BlockedUser[] = await res.json();
        if (!cancelled) setBlocked(data);
      } catch (error) {
        console.error(error);
        if (!cancelled) toast.error("Blocked users loading failed");
      }
    }
    fetchBlocked();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUnblock = async (user: BlockedUser) => {
    if (!confirm(`Unblock @${user.username} ? Previous links and matches will not be restored.`)) return;
    setPendingId(user.id);
    try {
      const res = await fetch(`/api/match/${user.id}/block`, { method: "DELETE" });
      // 404: already unblocked (e.g. from another tab), drop it from the list anyway
      if (res.ok || res.status === 404) {
        setBlocked((prev) => prev?.filter((u) => u.id !== user.id) ?? null);
        toast.success(`@${user.username} unblocked`);
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Blocked users</h2>

      {blocked === null ? (
        <p className="text-gray-500">Loading...</p>
      ) : blocked.length === 0 ? (
        <p className="text-gray-500">You have not blocked anyone.</p>
      ) : (
        <ul className="divide-y divide-pink-100">
          {blocked.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <span className="font-semibold text-pink-700">{user.first_name}</span>
                <span className="text-sm text-gray-500"> @{user.username}</span>
                <p className="text-xs text-gray-400">
                  Blocked on {new Date(user.blocked_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                onClick={() => handleUnblock(user)}
                disabled={pendingId === user.id}
                className="shrink-0 rounded-full text-sm"
              >
                {pendingId === user.id ? "..." : "Unblock"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
