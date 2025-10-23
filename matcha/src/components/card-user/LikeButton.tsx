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
  onUserUpdate?: () => void
}) {
  const [disabled, setDisabled] = useState(false);
  const {socket} =  useSocket();
  const {me} = useUser();

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    let method = '';
    if (user.likeStatus == 'isLiked' || user.likeStatus == 'none')
      method = 'POST';
    else
      method = 'DELETE';
    try {
      const res = await fetch(`/api/match/${user.id}/like`, { method: method });
      if (res.status === 204){ // Easter egg
        setDisabled(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        // user.likeStatus= await getMatchStatus(refUser.id, u.id);
        // setLiked(!liked);
        // ici socket.emit likenotif
        socket?.emit("notif", {
          from: me,
          to: user,
          msg: BUTTONTEXT[user.likeStatus]
          }
        );
        if (onUserUpdate)
          onUserUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <button
        className="bg-pink-500 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-pink-700 transition"
        onClick={(e) => { handleLike(e); }}
        disabled = {disabled}
    >
      {BUTTONTEXT[user.likeStatus]}
    </button>
  );
}