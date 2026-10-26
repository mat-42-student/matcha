"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { MAX_INTEREST_LENGTH, type PublicUser } from "@/lib/types";

interface Interest {
  id: number;
  name: string;
}

const MIN_INTERESTS = 3;

function byName(a: Interest, b: Interest) {
  return a.name.localeCompare(b.name);
}

export default function ProfileInterests({
  onUserUpdate,
}: {
  onUserUpdate?: (updates: Pick<PublicUser, "interests">) => void;
}) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [newTag, setNewTag] = useState("");
  const [adding, setAdding] = useState(false);

  // last selection confirmed by the server, restored if a save fails
  const savedRef = useRef<number[]>([]);
  // latest selection waiting to be sent, while a request is in flight
  const pendingRef = useRef<number[] | null>(null);
  const inFlightRef = useRef(false);
  // latest values, read after an await (tag creation, save): the state of the closure may be stale
  const selectedRef = useRef<number[]>([]);
  const interestsRef = useRef<Interest[]>([]);

  function updateInterests(next: Interest[]) {
    interestsRef.current = next;
    setInterests(next);
  }

  function updateSelected(next: number[]) {
    selectedRef.current = next;
    setSelected(next);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [allRes, userRes] = await Promise.all([
          fetch("/api/interests"),
          fetch("/api/me/interests"),
        ]);

        if (!allRes.ok || !userRes.ok) throw new Error("Network error");

        const allInterests: Interest[] = await allRes.json();
        const userInterests: Interest[] = await userRes.json();

        interestsRef.current = allInterests;
        setInterests(allInterests);
        savedRef.current = userInterests.map((i) => i.id);
        selectedRef.current = savedRef.current;
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
      updateSelected(savedRef.current);
      setStatus("idle");
    } else {
      setStatus("saved");
    }
    // user.interests holds names, not ids
    onUserUpdate?.({
      interests: interestsRef.current.filter((i) => savedRef.current.includes(i.id)).map((i) => i.name),
    });
  };

  const select = (next: number[]) => {
    updateSelected(next);
    pendingRef.current = next;
    flush();
  };

  const toggleInterest = (id: number) => {
    const current = selectedRef.current;
    select(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  // Create the tag (or get the existing one with that name), then select it
  const addInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adding || !newTag.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTag }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "The tag could not be added");
        return;
      }

      const interest: Interest = data;
      if (!interestsRef.current.some((i) => i.id === interest.id)) {
        updateInterests([...interestsRef.current, interest].sort(byName));
      }
      if (!selectedRef.current.includes(interest.id)) {
        select([...selectedRef.current, interest.id]);
      }
      setNewTag("");
    } catch (error) {
      console.error(error);
      toast.error("The tag could not be added");
    } finally {
      setAdding(false);
    }
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

      {/* new tag, shared with every user once created */}
      <form onSubmit={addInterest} className="flex gap-2 mt-4">
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          maxLength={MAX_INTEREST_LENGTH + 1}
          placeholder="#NewTag"
          aria-label="New tag"
          className="flex-1 min-w-0 px-3 py-1 rounded-full border border-pink-300 focus:outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          disabled={adding || !newTag.trim()}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-50"
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add
        </button>
      </form>
    </div>
  );
}
