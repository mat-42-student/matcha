// src/components/card-user/LikeButton.tsx

"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useSocket } from "@/context/SocketContext";
import { PublicUser } from "@/lib/types";
import { useUsersStore } from "@/context/UsersStore";

const BUTTONTEXT = {
  match: "Unmatch",
  like: "Unlike",
  isLiked: "Like back",
  block: "🚫",
  none: "Like",
}

export default function LikeButton({user}:{user: PublicUser}) {
  const { users, updateUser } = useUsersStore();
  const [disabled, setDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { socket, refreshNotifications, clearUnreadForUser } =  useSocket();
  const currentUser = users.find((u) => u.id === user.id) ?? user;

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isSubmitting || disabled) return;

    setIsSubmitting(true);
    const method = currentUser.likeStatus === 'isLiked' || currentUser.likeStatus === 'none' ? 'POST' : 'DELETE';
    try {
      const res = await fetch(`/api/match/${user.id}/like`, { method });
      if (res.status === 204){ // Easter egg
        setDisabled(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      if (!data.success && data.newStatus) {
        // nothing changed server-side: just resync the displayed status
        updateUser({ ...currentUser, likeStatus: data.newStatus });
        return;
      }
      if (data.success) {
        // The target user is notified by the API route
        socket?.emit("get-chat-users");
        if (method === "DELETE") {
          clearUnreadForUser(currentUser.id);
        }
        // fame recomputed by the server from the new state
        const fame = typeof data.fame === "number" ? data.fame : currentUser.fame;
        const updated: PublicUser = { ...currentUser, likeStatus: data.newStatus, fame };
        updateUser(updated);
        await refreshNotifications();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
        className="bg-pink-500 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-pink-700 transition"
        onClick={(e) => { handleClick(e); }}
        disabled = {disabled || isSubmitting}
    >
      {BUTTONTEXT[currentUser.likeStatus]}
    </button>
  );
}