// matcha/src/components/like/Matches.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Matches() {
  const router = useRouter();

  function handleClick() {
    router.push("/chat");
  }

  useEffect(handleClick);
}


// copy paste into chat

// import { useEffect, useState } from "react";
// import Browse from "@/components/browse/Browse";
// import { PublicUser } from "@/types";

// export default function Matches() {
//   const [users, setUsers] = useState<PublicUser[]>([]);
  
//   async function fetchMatches() {
//     const res = await fetch("/api/match/getMatches");
//     const data = await res.json();
//     setUsers(data);
//   }
  
//   useEffect(() => { fetchMatches() }, []);

//   return (
//     <div className="p-4">
//       <Browse users={users} refreshList={fetchMatches}/>
//     </div>
//   );
// }