"use client";

import { useState } from "react";
import { PublicUser } from "@/types";
import MainPic from "@/components/pics/MainPic";
import CardUserModal from "./CardUserModal";
// import LikeButton from "./LikeButton"

export default function CardUser({ user }: { user: PublicUser }) {
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
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-xl text-pink-700 font-semibold">
            {user.username}
          </span>
          <span className="text-sm text-gray-400"> ({user.gender})</span>
        </div>
        <span className="text-sm text-gray-600">
          {user.age} ans
        </span>
      </div>
        <div className="flex justify-center">
          <MainPic userId={user.id}/>
        </div>
        <span className="text-gray-800 mb-2 text-right">{user.city}</span>
        <p className="text-gray-600 mb-4">
          {user.bio?.slice(0, 100) || "No bio yet"}
        </p>
      </div>

      {open && <CardUserModal user={user} onClose={() => setOpen(false)} />}
    </>
  );
}