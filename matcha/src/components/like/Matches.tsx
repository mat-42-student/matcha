// matcha/src/components/like/Matches.tsx

import { useEffect, useState } from "react";
import CardUser from "@/components/card-user/CardUser";
import { PublicUser } from "@/types";

export default function Matches() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  
  async function fetchMatches() {
    const res = await fetch("/api/match/getMatches");
    const data = await res.json();
    setUsers(data);
  }
  
  useEffect(() => { fetchMatches() }, []);

  return (
    <div className="h-full p-4">
      {users.length > 0 ? 
      <div className="flex flex-wrap justify-center">
        {users.map((u) => (
          <CardUser key={u.username} user={u} onUserUpdate={fetchMatches}/>
        ))}
      </div>
      :
      <span>No matches for now</span>
    }
    </div>
  )
}