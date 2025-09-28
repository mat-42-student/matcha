"use client";

import { useState } from "react";
import CardUser from "@/components/card-user/CardUser";
import Navigation from "./Navigation";
import { PublicUser } from "@/types";

export default function Browse( { users }: { users: PublicUser[] } ) {
  const [page, setPage] = useState(1);
  const perPage = 12;

  const totalPages = Math.ceil(users.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentUsers = users.slice(startIndex, startIndex + perPage);

  function nextPage(){
    if (page < totalPages)
      setPage(page + 1);
  }

  function prevPage(){
    if (page > 0)
      setPage(page - 1);
  }

  if (users.length === 0)
    return <div className="p-4">No results</div>

  return (
    <div className="p-4">
      <div className="flex flex-wrap justify-center">
        {currentUsers.map((u) => (
          <CardUser key={u.username} user={u} />
        ))}
      </div>

      {users.length > perPage && <Navigation page={page} totalPages={totalPages} prev={prevPage} next={nextPage} />}
    </div>
  );
}
