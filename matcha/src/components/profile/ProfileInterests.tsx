"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type { PublicUser } from "@/lib/types";

interface Interest {
  id: number;
  name: string;
}

const MIN_INTERESTS = 3;

export default function ProfileInterests({
  onUserUpdate,
}: {
  onUserUpdate?: (updates: Pick<PublicUser, "interests">) => void;
}) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  // last selection confirmed by the server, restored if a save fails
  const savedRef = useRef<number[]>([]);
  // latest selection waiting to be sent, while a request is in flight
  const pendingRef = useRef<number[] | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [allRes, userRes] = await Promise.all([
          fetch("/api/interests"),
          fetch("/api/me/interests"),
        ]);

        if (!allRes.ok || !userRes.ok) throw new Error("Network error");

        const allInterests = await allRes.json();
        const userInterests: Interest[] = await userRes.json();

        setInterests(allInterests);
        savedRef.current = userInterests.map((i) => i.id);
        setSelected(savedRef.current);
      } catch (error) {
        console.error(error);
        toast.error("Interests loading failed");
      }
    }
    fetchData();
  }, []);

  // One request at a time: clicks made meanwhile are merged into a single next
  // request carrying the latest selection, so responses can never arrive out of order.
  const flush = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus("saving");

    let failed = false;
    while (pendingRef.current) {
      const ids = pendingRef.current;
      pendingRef.current = null;
      try {
        const res = await fetch("/api/me/interests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interestIds: ids }),
        });
        if (!res.ok) throw new Error("Saving failed");
        savedRef.current = ids;
      } catch (error) {
        console.error(error);
        failed = true;
        pendingRef.current = null;
      }
    }

    inFlightRef.current = false;
    if (failed) {
      toast.error("Your interests could not be saved");
      setSelected(savedRef.current);
      setStatus("idle");
    } else {
      setStatus("saved");
    }
    // user.interests holds names, not ids
    onUserUpdate?.({
      interests: interests.filter((i) => savedRef.current.includes(i.id)).map((i) => i.name),
    });
  };

  const toggleInterest = (id: number) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    pendingRef.current = next;
    flush();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">My interests</h2>
        <span className="flex items-center gap-1 text-sm text-gray-500" aria-live="polite">
          {status === "saving" && (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving...
            </>
          )}
          {status === "saved" && (
            <>
              <Check size={14} className="text-green-600" /> Saved
            </>
          )}
        </span>
      </div>
      <p className={`text-sm mb-4 ${selected.length < MIN_INTERESTS ? "text-pink-600" : "text-gray-500"}`}>
        {selected.length} selected
        {selected.length < MIN_INTERESTS && ` · pick at least ${MIN_INTERESTS}`}
      </p>

      {/* interests list */}
      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => {
          const active = selected.includes(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggleInterest(interest.id)}
              className={`px-3 py-1 rounded-full border transition ${
                active
                  ? "bg-pink-500 text-white border-pink-500"
                  : "border-pink-300 text-gray-700 hover:bg-pink-100"
              }`}
            >
              {interest.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
