// src/components/browse/Browse.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import CardUser from "@/components/card-user/CardUser";
import Navigation from "./Navigation";
import FilterBar, {
  DEFAULT_FILTERS,
  filterUsers,
  FilterValues,
} from "./FilterBar";
import { useUsersStore } from "@/context/UsersStore";
import { useSocket } from "@/context/SocketContext";

export default function Browse() {
  const { users, updateUserLikeStatus } = useUsersStore();
  const { relationChanged } = useSocket();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const perPage = 12;

  useEffect(() => {
    if (!relationChanged) return;
    updateUserLikeStatus(relationChanged.userId, relationChanged.likeStatus);
  }, [relationChanged, updateUserLikeStatus]);

  const filteredUsers = useMemo(
    () => filterUsers(users, filters),
    [users, filters],
  );

  function handleFilterChange(newFilters: FilterValues) {
    setFilters(newFilters);
    setPage(1);
  }

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + perPage);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-start">
      <div className="sticky top-0 self-start">
        <FilterBar values={filters} onChange={handleFilterChange} />
      </div>
      <main className="flex-1 flex flex-col items-center p-4 md:p-6 overflow-hidden">
        {currentUsers.length > 0 ? (
          <div className=" border-2 flex flex-wrap justify-center gap-4 w-full max-w-[90%]">
            {currentUsers.map((u) => (
              <CardUser key={u.id} user={u} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-zinc-800 text-sm">
            Aucun profil ne correspond aux critères sélectionnés.
          </div>
        )}
        {filteredUsers.length > perPage && (
          <div className="mt-8">
            <Navigation
              page={page}
              totalPages={totalPages}
              prev={() => setPage((p) => Math.max(p - 1, 1))}
              next={() => setPage((p) => Math.min(p + 1, totalPages))}
            />
          </div>
        )}
      </main>
    </div>
  );
}
