"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface Interest {
  id: number;
  name: string;
}

export default function ProfileInterests({ user, onUserUpdate }: { user: any, onUserUpdate?: (updates: Partial<any>) => void }) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [allRes, userRes] = await Promise.all([
          fetch("/api/interests"),
          fetch("/api/me/interests"),
        ]);

        if (!allRes.ok || !userRes.ok) throw new Error("Network error");

        const allInterests = await allRes.json();
        const userInterests = await userRes.json();

        setInterests(allInterests);
        setSelected(userInterests.map((i: Interest) => i.id));
      } catch (error) {
        console.error(error);
        toast.error("Interests loading failed");
      }
    }
    fetchData();
  }, []);

  const toggleInterest = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interestIds: selected }),
      });

      const data = await res.json();


      if (res.ok) {
        toast.success("Interests updated !");
        setHasChanges(false);
        onUserUpdate && onUserUpdate({ interests: selected });
      } else {
        toast.error("Error during saving");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4">My interest</h2>

      {/* interests list */}
      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => {
          const active = selected.includes(interest.id);
          return (
            <button
              key={interest.id}
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

      {hasChanges && (
        <div className="mt-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-full"
          >
            {loading ? "saving..." : "Confirm"}
          </Button>
        </div>
      )}
    </div>
  );
}
