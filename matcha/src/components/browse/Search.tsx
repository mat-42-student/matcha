// matcha/src/components/browse/Search.tsx

"use client";

import { useState } from "react";
import { PublicUser, SearchCriteria } from "@/lib/types";
import SearchForm from "@/components/forms/SearchForm";
import Browse from "@/components/browse/Browse";
import { UsersStoreProvider } from "@/context/UsersStore";

export default function Search() {
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
    console.log("users: ", data.users)
    setResults(data.users);
  }

  return (
    <div className="space-y-6">
      <SearchForm onSubmit={handleSearch} />
      {results && 
          <UsersStoreProvider initialUsers={results}>
            <Browse />
          </UsersStoreProvider>
       }
    </div>
  );
}