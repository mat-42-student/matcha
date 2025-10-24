// matcha/src/components/browse/Browse.tsx

"use client";

import { useState, useEffect } from "react";
import CardUser from "@/components/card-user/CardUser";
import Navigation from "./Navigation";
import { PublicUser } from "@/lib/types";
import FilterBar from "./FilterBar";

export default function Browse({ users }: { users: PublicUser[] }) {
  const [page, setPage] = useState(1);
  const [usersState, setUsersState] = useState(users);
  const [filteredUsers, setFilteredUsers] = useState(users);
  const perPage = 12;

  // Synchroniser quand `users` (prop serveur) change
  useEffect(() => {
    setUsersState(users);
    setFilteredUsers(users);
    setPage(1);
  }, [users]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + perPage);

  // Update global d’un utilisateur
  function handleUserUpdate(updatedUser: PublicUser) {
    setUsersState(prev =>
      prev.map(u => (u.id === updatedUser.id ? updatedUser : u))
    );
    setFilteredUsers(prev =>
      prev.map(u => (u.id === updatedUser.id ? updatedUser : u))
    );
  }

  function nextPage() {
    if (page < totalPages) setPage(page + 1);
  }

  function prevPage() {
    if (page > 1) setPage(page - 1);
  }

  if (filteredUsers.length === 0) {
    return <div className="p-4">No results</div>;
  }

  return (
    <div className="p-4">
      {/* ✅ utiliser usersState comme base de filtrage */}
      <FilterBar users={usersState} onChange={setFilteredUsers} />

      <div className="flex flex-wrap justify-center">
        {currentUsers.map((u) => (
          <CardUser key={u.id} user={u} onUserUpdate={handleUserUpdate} />
        ))}
      </div>

      {filteredUsers.length > perPage && (
        <Navigation
          page={page}
          totalPages={totalPages}
          prev={prevPage}
          next={nextPage}
        />
      )}
    </div>
  );
}
