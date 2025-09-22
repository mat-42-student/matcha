// matcha/src/components/like/Liked.tsx

import { useEffect, useState } from "react";
import CardUser from "@/components/card-user/CardUser";
import { PublicUser } from "@/types";

export default function Liked() {
  const [users, setUsers] = useState<PublicUser[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/match/getLikes");
      const data = await res.json();
      setUsers(data);
    }
    fetchUsers();
  }, []);

  return (
    <div className="h-full overflow-auto p-4">
      {
        users.length > 0 ? (
          <div className="flex flex-wrap justify-center">
            {users.map((u) => (
              <CardUser key={u.username} user={u} />
            ))}
          </div>
        ) : 
        <span>Go like someone !</span>
      }
    </div>
  );
}