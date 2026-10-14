// matcha/src/components/browse/BrowseFromUrl.tsx
"use client";

import { useEffect, useState } from "react";
import Browse from "@/components/browse/Browse";
import { PublicUser } from "@/lib/types";
import { UsersStoreProvider } from "@/context/UsersStore";

// Fetches a list of users from an API route and displays it with Browse
export default function BrowseFromUrl({ url }: { url: string }) {
  const [users, setUsers] = useState<PublicUser[]>([]);

  useEffect(() => {
    // Ignore the response if the url changed or the component unmounted in the meantime
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`Failed to fetch users (${url}):`, res.status);
          return;
        }
        const data: PublicUser[] = await res.json();
        if (!cancelled) setUsers(data);
      } catch (err) {
        console.error(`Could not retrieve users (${url}):`, err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <UsersStoreProvider initialUsers={users}>
      <Browse />
    </UsersStoreProvider>
  );
}
