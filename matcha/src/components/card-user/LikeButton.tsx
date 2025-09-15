"use client";

import { useState } from "react";
import { User } from "@/lib/db/users";

const me = fetch(`api/me`);

export default function LikeButton({ user }: { user: User }) {
  const [liked, setLiked] = useState(false);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    setLiked(!liked);
    
    console.log("Liked user:", user.id);
  }

  return (
    <button
        className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition"
        onClick={(e) => { handleLike(e); }}
    >
      {liked ? "Unlike" : "Like"}
    </button>
  );
}