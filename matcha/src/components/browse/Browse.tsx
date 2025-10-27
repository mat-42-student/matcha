// src/components/browse/Browse.tsx
"use client";

import { useState, useEffect } from "react";
import CardUser from "@/components/card-user/CardUser";
import Navigation from "./Navigation";
import FilterBar from "./FilterBar";
import { useUsersStore } from "@/context/UsersStore";

export default function Browse() {
  const { users } = useUsersStore();
  const [page, setPage] = useState(1);
  const [filteredUsers, setFilteredUsers] = useState(users);
  const perPage = 12;

  useEffect(() => {
    setFilteredUsers(users);
    setPage(1);
  }, [users]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + perPage);

  return (
    <div className="p-4">
      <FilterBar users={users} onChange={setFilteredUsers} />

      <div className="flex flex-wrap justify-center">
        {currentUsers.map(u => (
          <CardUser key={u.id} user={u} />
        ))}
      </div>

      {filteredUsers.length > perPage && (
        <Navigation
          page={page}
          totalPages={totalPages}
          prev={() => setPage(p => Math.max(p - 1, 1))}
          next={() => setPage(p => Math.min(p + 1, totalPages))}
        />
      )}
    </div>
  );
}
