// src/components/card-user/CardUser.tsx
"use client";

import { useState } from "react";
import { PublicUser, COLOR } from "@/lib/types";
import Image from "next/image";
import CardUserModal from "./CardUserModal";
import Interests from "./Interests";
import { useUsersStore } from "@/context/UsersStore";

export default function CardUser({ user }: { user: PublicUser }) {
  const { updateUser } = useUsersStore();
  const [open, setOpen] = useState(false);
  const mainPic = `/api/users/${user.id}/pics`;

  async function handleCardClick() {
    setOpen(true);
    try {
      const res = await fetch(`/api/match/${user.id}/views/`, { method: "POST" });
      const data = await res.json();
      if (data.scored) updateUser({ ...user, fame: user.fame + 1 });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <div
        className={`w-72 ${COLOR[user.likeStatus]} border-2 border-gray-300 rounded-lg shadow-md p-4 m-4 cursor-pointer hover:border-pink-500 flex flex-col`}
        onClick={handleCardClick}
        title={user.score.toString()}
      >
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-xl text-pink-700 font-semibold">{user.first_name}</span>
            <span className="text-sm text-gray-400"> ({user.gender})</span>
            <span className="text-sm text-gray-600">{user.age} ans</span>
            <div className="text-xs text-gray-500">@{user.username}</div>
          </div>
          <span className="text-sm text-gray-600">⭐{user.fame}</span>
        </div>

        <div className="flex justify-center">
          <Image
            unoptimized
            width={0}
            height={0}
            style={{ width: "auto", height: "auto" }}
            className="max-h-48 rounded shadow-md"
            src={mainPic}
            alt="profile picture"
            loading="eager"
          />
        </div>

        <div className="text-gray-800 mt-auto flex justify-between">
          <span>{user.city}</span>
          <span>{user.distance} km</span>
        </div>
        <div className="text-xs text-gray-500 mb-2">
          {user.commonTags} tag{user.commonTags > 1 ? "s" : ""} en commun
        </div>

        <Interests interests={user.interests} />
      </div>

      {open && (
        <CardUserModal
          user={user}
          mainPic={mainPic}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
