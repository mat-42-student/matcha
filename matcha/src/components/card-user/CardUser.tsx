"use client";

import { useState } from "react";
import { PublicUser } from "@/types";
import MainPic from "@/components/pics/MainPic";
import CardUserModal from "./CardUserModal";
import Interests from "./interests";

export default function CardUser({
  user,
  onUserUpdate,
 }: { 
  user: PublicUser;
  onUserUpdate?: () => void;
}) {

  const [open, setOpen] = useState(false);

  function handleCardClick() {
    setOpen(true);
  }

  return (
    <>
      <div
        className="w-72 bg-white border-2 border-gray-300 rounded-lg shadow-md p-4 m-4 cursor-pointer
                  hover:border-pink-500 flex flex-col"
        onClick={() => handleCardClick()}
      >
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-xl text-pink-700 font-semibold">
              {user.username}
            </span>
            <span className="text-sm text-gray-400"> ({user.gender})</span>
          </div>
          <span className="text-sm text-gray-600">{user.age} ans</span>
        </div>

        <div className="flex justify-center">
          <MainPic userId={user.id} />
        </div>

        <div className="text-gray-800 mb-2 mt-auto">{user.city}</div>
        <div>
          <Interests interests={user.interests} />
        </div>
      </div>

      {open && <CardUserModal user={user} onClose={() => setOpen(false)} onUserUpdate={onUserUpdate}/>}
    </>
  );
}