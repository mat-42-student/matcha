// src/components/card-user/LikeButton.tsx

"use client";

import { useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { useMe } from "@/context/UserContext";
import { PublicUser } from "@/lib/types";
import { useUsersStore } from "@/context/UsersStore";

const BUTTONTEXT = {
  match: "Unmatch",
  like: "Unlike",
  isLiked: "Match",
  block: "🚫",
  none: "Like",
}

export default function LikeButton({user}:{user: PublicUser}) {
  const { updateUser } = useUsersStore();
  const [disabled, setDisabled] = useState(false);
  const { socket, refreshNotifications } =  useSocket();
  const {me} = useMe();

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    let method = '';
    let deltaFame = 0;
    if (user.likeStatus === 'isLiked' || user.likeStatus === 'none') {
      method = 'POST';
      deltaFame = 5;
    }
    else{
      method = 'DELETE';
      deltaFame = -5;
    }
    try {
      const res = await fetch(`/api/match/${user.id}/like`, { method });
      if (res.status === 204){ // Easter egg
        setDisabled(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        const notifMsg = method === "POST"
          ? (data.newStatus === "match" ? "match" : "like")
          : "unlike";

        socket?.emit("notif", {
          from: me,
          to: user,
          msg: notifMsg
          }
        );
        const fame = Math.min(Math.max(0, user.fame + deltaFame), 100)
        const updated: PublicUser = { ...user, likeStatus: data.newStatus, fame };
        updateUser(updated);
        await refreshNotifications();
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
      {BUTTONTEXT[user.likeStatus]}
    </button>
  );
}