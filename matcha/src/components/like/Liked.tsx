// matcha/src/components/like/Liked.tsx

import { useEffect, useState } from "react";
import CardUser from "@/components/card-user/CardUser";
import { PublicUser } from "@/types";

export default function Liked() {
  const [users, setUsers] = useState<PublicUser[]>([]);

  async function fetchUsers() {
    const res = await fetch("/api/match/getLikes");
    const data = await res.json();
    setUsers(data);
  }
  useEffect(() => { fetchUsers() }, []);

  return (
    <div className="h-full p-4">
      {
        users.length > 0 ? (
          <div className="flex flex-wrap justify-center">
            {users.map((u) => (
              <CardUser key={u.username} user={u} onUserUpdate={fetchUsers}/>
            ))}
          </div>
        ) : 
        <span>Go like someone !</span>
      }
    </div>
  );
}