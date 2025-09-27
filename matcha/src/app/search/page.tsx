"use client";

import { useState } from "react";
import SearchForm from "@/components/forms/SearchForm";
import CardUser from "@/components/card-user/CardUser";

export default function SearchPage() {
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch(criteria: any) {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(criteria),
    });
    const data = await res.json();
    setResults(data.users); // par ex. { users: [...] }
  }

  return (
    <div className="space-y-6">
      <SearchForm onSubmit={handleSearch} />
      <div>
        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {results.map((user) => (
              <CardUser key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <p>Aucun résultat</p>
        )}
      </div>
    </div>
  );
}
