// matcha/src/components/card-user/CardUser.tsx

"use client";

import { useEffect, useState } from "react";
import { PublicUser, Picture } from "@/types";
import CardUserModal from "./CardUserModal";
import Interests from "./Interests";

export default function CardUser({
  user,
  onUserUpdate,
 }: { 
  user: PublicUser;
  onUserUpdate?: () => void;
}) {

  const [open, setOpen] = useState(false);
  const [mainPic, setMainPic] = useState<Picture>({mime_type: "", data: ""});

async function fetchMainPic() {
  try {
    const res = await fetch(`/api/users/${user.id}/pics/`);
    if (res.status === 204)
      return;
    if (!res.ok) {
      console.error(`API Error: ${res.status}`);
      return;
    }
    const pic: Picture = await res.json();
    setMainPic(pic);
  } catch (err) {
    console.error("Could not retrieve main picture:", err);
  }
}
  function handleCardClick() {
    setOpen(true);
  }

  useEffect(() => {fetchMainPic()}, []);

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
          <img
            className="max-h-48"
            src={`data:${mainPic.mime_type};base64,${mainPic.data}`}
            alt="profile picture" />
        </div>

        <div className="text-gray-800 mb-2 mt-auto">{user.city}</div>
        <div>
          <Interests interests={user.interests} />
        </div>
      </div>

      {open && <CardUserModal user={user} mainPic={mainPic} onClose={() => setOpen(false)} onUserUpdate={onUserUpdate}/>}
    </>
  );
}