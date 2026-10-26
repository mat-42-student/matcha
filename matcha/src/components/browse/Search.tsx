// matcha/src/components/browse/Search.tsx

"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { PublicUser, SearchCriteria } from "@/lib/types";
import SearchForm from "@/components/forms/SearchForm";
import Browse from "@/components/browse/Browse";
import { UsersStoreProvider } from "@/context/UsersStore";

export default function Search() {
  const [results, setResults] = useState<PublicUser[]>([]);
  // bumped on every search so Browse remounts with its pagination back to page 1
  const [searchId, setSearchId] = useState(0);

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
    if (!res.ok) {
      toast.error(data.error ?? "Search failed");
      setResults([]);
      return;
    }
    setResults(data.users);
    setSearchId((id) => id + 1);
  }

  return (
    <div className="space-y-6">
      <SearchForm onSubmit={handleSearch} />
      {results && 
          <UsersStoreProvider initialUsers={results}>
            <Browse key={searchId} />
          </UsersStoreProvider>
       }
    </div>
  );
}