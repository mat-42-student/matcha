// matcha/src/components/browse/Browse.tsx

"use client";

import { useState, useEffect } from "react";
import CardUser from "@/components/card-user/CardUser";
import Navigation from "./Navigation";
import { PublicUser } from "@/types";
import FilterBar from "./FilterBar";

export default function Browse({ users, refreshList }: { users: PublicUser[]; refreshList?: () => void
 }) {
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

  function nextPage() {
    if (page < totalPages) setPage(page + 1);
  }

  function prevPage() {
    if (page > 1) setPage(page - 1);
  }

  if (users.length === 0) {
    return <div className="p-4">No results</div>;
  }

  return (
    <div className="p-4">
      <FilterBar users={users} onChange={setFilteredUsers} />
      <div className="flex flex-wrap justify-center">
        {currentUsers.map((u) => (
          <CardUser key={u.first_name} user={u} onUserUpdate={refreshList}/>
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
