"use client";

import { useState } from "react";
import { PublicUser } from "@/types";

export default function LikeButton({ user }: { user: PublicUser }) {
  const [liked, setLiked] = useState(false);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    console.log("fetch vers : ", user.id)
    setLiked(!liked);
    fetch(`/api/match/${user.id}/like`, { method: "POST" })
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.error(err));
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