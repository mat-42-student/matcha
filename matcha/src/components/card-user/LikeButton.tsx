// src/components/card-user/LikeButton.tsx

"use client";

import { useState } from "react";
import { PublicUser } from "@/lib/types";
import { useSocket } from "@/context/SocketContext";
import { useUser } from "@/context/UserContext";


const BUTTONTEXT = {
  match: "Unmatch",
  like: "Unlike",
  isLiked: "Match",
  block: "🚫",
  none: "Like",
}

export default function LikeButton({
  user,
  onUserUpdate
}: {
  user: PublicUser,
  onUserUpdate: (u: PublicUser) => void
}) {
  const [disabled, setDisabled] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const {socket} =  useSocket();
  const {me} = useUser();

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    let method = '';
    if (localUser.likeStatus === 'isLiked' || localUser.likeStatus === 'none')
      method = 'POST';
    else
      method = 'DELETE';
    try {
      const res = await fetch(`/api/match/${localUser.id}/like`, { method: method });
      if (res.status === 204){ // Easter egg
        setDisabled(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        socket?.emit("notif", {
          from: me,
          to: localUser,
          msg: BUTTONTEXT[localUser.likeStatus]
          }
        );
        const updated = { ...localUser, likeStatus: data.newStatus };
        setLocalUser(updated);
        onUserUpdate(updated);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <button
        className="bg-pink-500 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-pink-700 transition"
        onClick={(e) => { handleClick(e); }}
        disabled = {disabled}
    >
      {BUTTONTEXT[localUser.likeStatus]}
    </button>
  );
}