"use client";

import { useState } from "react";
import { User } from "@/lib/db/users";
import MainPic from "@/components/pics/MainPic";
import CardUserModal from "./CardUserModal";
import LikeButton from "./LikeButton"

export default function CardUser({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    console.log("Liked user:", user.id);
  }

  function handleCardClick() {
    setOpen(true);
  }

  return (
    <>
      <div
        className="w-72 bg-white border border-gray-300 rounded-lg shadow-md p-4 m-4 inline-block cursor-pointer"
        onClick={() => handleCardClick()}
      >
        <span className="text-xl text-pink-700 font-semibold mb-2">{user.username}</span>
        <span className="text-sm text-gray-400">({user.gender})</span>
        <MainPic userId={user.id} />
        <span className="text-gray-800 mb-2 text-right">{user.city}</span>
        <p className="text-gray-600 mb-4">
          {user.bio?.slice(0, 100) || "No bio yet"}
        </p>
        <LikeButton user={user} />
        
      </div>

      {open && <CardUserModal user={user} onClose={() => setOpen(false)} />}
    </>
  );
}