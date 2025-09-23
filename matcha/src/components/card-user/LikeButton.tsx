"use client";

import { useState, useEffect } from "react";
import { PublicUser } from "@/types";

function getButtonText(liked: boolean, status: string) {
  if (status === "match") return "Unmatch";
  
  if (liked) return "Unlike";
  if (status === "isLiked") return "Match !";
  return "Like";
}

export default function LikeButton({
  user,
  onUserUpdate
}: {
  user: PublicUser,
  onUserUpdate?: () => void
}) {
  const [liked, setLiked] = useState(false);
  const [status, setStatus] = useState("");

  async function fetchLikeStatus() {
    try {
      const res = await fetch(`/api/match/${user.id}/status`);
      const data = await res.json();
      if (data.status === "like") {
        setLiked(true);
        setStatus("");
      } else if (data.status === "match") {
        setLiked(true);
        setStatus("match")
      } else if (data.status === "isLiked") {
        setLiked(false);
        setStatus("isLiked")
      } else {
        setLiked(false)
        setStatus("")
      }
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  }

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    let url = '';
    if (!liked)
      url = `/api/match/${user.id}/like`;
    else
      url = `/api/match/${user.id}/unlike`;
    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLiked(!liked);
        if (onUserUpdate)
          onUserUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { fetchLikeStatus() }, []);

  return (
    <>
      <button
          className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition"
          onClick={(e) => { handleLike(e); }}
      >
        {getButtonText(liked, status)}
      </button>
      {status === "isLiked" && <span className="text-pink-800">(❤️ Likes you)</span>}
    </>
  );
}