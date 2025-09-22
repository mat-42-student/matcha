// matcha/src/components/like/LikeMe.tsx

import { useEffect, useState } from "react";
import CardUser from "@/components/card-user/CardUser";
import { PublicUser } from "@/types";

export default function LikeMe() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  
  async function fetchLikeMe() {
    try {
      const res = await fetch('api/match/getLikeMe')
      if (!res.ok) {
        console.log(`API Error: ${res.status}`);
        return;
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Could not retrieve users :", err);
    }
  }

  useEffect(() => { fetchLikeMe() }, [])

  return (
    <div className="h-full overflow-auto p-4">
      {users.length > 0 ? 
      <div className="flex flex-wrap justify-center">
        {users.map((u) => (
          <CardUser key={u.username} user={u} />
        ))}
      </div>
      :
      <span>No likes for now</span>
    }
    </div>
  )
}