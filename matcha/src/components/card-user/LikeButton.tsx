"use client";

import { useState, useEffect } from "react";
import { PublicUser } from "@/lib/types";
import { useSocket } from "@/context/SocketContext";
import { useUser } from "@/context/UserContext";



export default function LikeButton({
  user,
  onUserUpdate
}: {
  user: PublicUser,
  onUserUpdate?: () => void
}) {
  const [liked, setLiked] = useState(false);
  const [status, setStatus] = useState("");
  const [disabled, setDisabled] = useState(false);
  const {socket} =  useSocket();
  const {me} = useUser();

  function getButtonText(liked: boolean, status: string) {
    if (disabled) return "Seriously ?";
    if (status === "match") return "Unmatch";
    
    if (liked) return "Unlike";
    if (status === "isLiked") return "Match !";
    return "Like";
  }

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    let method = '';
    if (!liked)
      method = 'POST';
    else
      method = 'DELETE';
    try {
      const res = await fetch(`/api/match/${user.id}/like`, { method: method });
      if (res.status === 204){
        setDisabled(true);
        return;
      }
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

  useEffect(() => {
    async function fetchLikeStatus() {
      try {
        const res = await fetch(`/api/match/${user.id}/like`, { method: 'GET' });
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
    fetchLikeStatus()
  });

  return (
    <>
      <button
          className="bg-pink-500 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-pink-700 transition"
          onClick={(e) => { handleLike(e); }}
          disabled = {disabled}
      >
        {getButtonText(liked, status)}
      </button>
      {status === "isLiked" && <span className="text-pink-800">(❤️ Likes you)</span>}
    </>
  );
}