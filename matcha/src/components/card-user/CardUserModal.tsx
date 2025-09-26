// matcha/src/components/card-user/CardUserModal.tsx

"use client"

import { useState, useEffect } from "react";
import { PublicUser, Picture } from "@/types";
import Image from "next/image";
import LikeButton from "./LikeButton"


export default function CardUserModal({
  user,
  mainPic,
  onClose,
  onUserUpdate,
}: {
  user: PublicUser;
  mainPic: Picture;
  onClose: () => void;
  onUserUpdate?: () => void;
}) {

  const [pics, setPics] = useState<Picture[] >([mainPic]);
  const [current, setCurrent] = useState(0);

  function nextPic() {
    if (current <= pics.length)
      setCurrent(current + 1);
  }

  function prevPic() {
    if (current > 0)
      setCurrent(current - 1);
  }

  useEffect(() => { 
    async function fetchPics(userId: string) {
      const res = await fetch(`/api/users/${userId}/allpics`);
      if (!res.ok || res.status === 204)
        return [];
      return await res.json();
    }

    async function loadPics() {
      const extraPics = await fetchPics(user.id);
      setPics([mainPic, ...extraPics]);
    }

    loadPics();
  }, []);

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-96 relative"
        onClick={(e) => e.stopPropagation()}
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

        { pics.length !== 0 &&
          <>
            <Image
              unoptimized
              width={0}
              height={0}
              style={{width: "auto", height:"auto"}}
              src={`data:${pics[current].mime_type};base64,${pics[current].data}`}
              alt={`photo ${current + 1}`}
              className="rounded-lg shadow-md w-full object-cover my-2"
            />
            <div className="flex justify-between mt-2">
              <button
                onClick={prevPic}
                className="px-3 py-1 bg-pink-500 rounded disabled:opacity-30"
                disabled={current === 0}
              >
                ◀
              </button>
              <span className="text-sm text-gray-500">
                {current + 1} / {pics.length}
              </span>
              <button
                onClick={nextPic}
                className="px-3 py-1 bg-pink-500 rounded disabled:opacity-30"
                disabled={current + 1  >= pics.length}
              >
                ▶
              </button>
            </div>
          </>
        }

        <p className="text-gray-700 mt-2">{user.bio}</p>
        <p className="text-sm text-gray-400">{user.city}</p>

        <LikeButton user={user} onUserUpdate={onUserUpdate}/>
      </div>
    </div>
  );
}
