"use client";

import { useState } from "react";
import { PublicUser } from "@/types";

export default function LikeButton({ user }: { user: PublicUser }) {
  const tmp_like = fetch(``);
  const [liked, setLiked] = useState(false);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    setLiked(!liked);
    
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