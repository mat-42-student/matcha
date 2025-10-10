// matcha/src/app/search/page.tsx

"use client";

import { useState } from "react";
import { PublicUser, SearchCriteria } from "@/types";
import SearchForm from "@/components/forms/SearchForm";
import Browse from "@/components/browse/Browse";

export default function SearchPage() {
  const [results, setResults] = useState<PublicUser[]>([]);

  async function handleSearch(criteria: SearchCriteria) {
    if (Object.keys(criteria).length === 0) {
      setResults([]);
      return;
    }
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
      {results && <Browse users={results} /> }
    </div>
  );
}
