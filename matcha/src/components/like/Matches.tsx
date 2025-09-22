// matcha/src/components/like/Matches.tsx

import { useEffect, useState } from "react";
import CardUser from "@/components/card-user/CardUser";
import { PublicUser } from "@/types";

export default function Matches() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  
  useEffect(() => {
    async function fetchMatches() {
      const res = await fetch("/api/match/getMatches");
      const data = await res.json();
      setUsers(data);
    }
    fetchMatches();
  }, []);

  return (
    <div className="h-full overflow-auto p-4">
      {users.length > 0 ? 
      <div className="flex flex-wrap justify-center">
        {users.map((u) => (
          <CardUser key={u.username} user={u} />
        ))}
      </div>
      :
      <span>No matches for now</span>
    }
    </div>
  )
}