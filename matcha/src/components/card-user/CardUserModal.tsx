"use client"

import { useState, useEffect } from "react";
import { PublicUser } from "@/types";
import LikeButton from "./LikeButton"

async function fetchPics(userId: string) {
  const res = await fetch(`/api/users/${userId}/allpics`);
  if (!res.ok)
    return [];
  return await res.json();
}

export default function CardUserModal({
  user,
  onClose,
  onUserUpdate,
}: {
  user: PublicUser;
  onClose: () => void;
  onUserUpdate?: () => void;
}) {
  const [pics, setPics] = useState<
    { id: number; mime_type: string; data: string; is_main: boolean }[]
  >([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchPics(user.id).then(setPics);
  }, [user.id]);

  function nextPic() {
    setCurrent((prev) => (prev + 1) % pics.length);
  }

  function prevPic() {
    setCurrent((prev) => (prev - 1 + pics.length) % pics.length);
  }

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
        <img
          src={`data:${pics[current].mime_type};base64,${pics[current].data}`}
          alt={`photo ${current + 1}`}
          className="rounded-lg shadow-md w-full object-cover my-2"
        />
        }

        { pics.length > 1 &&
          <div className="flex justify-between mt-2">
            <button
              onClick={prevPic}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              ◀
            </button>
            <span className="text-sm text-gray-500">
              {current + 1} / {pics.length}
            </span>
            <button
              onClick={nextPic}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              ▶
            </button>
          </div>
        }

        <p className="text-gray-700 mt-2">{user.bio}</p>
        <p className="text-sm text-gray-400">{user.city}</p>

        <LikeButton user={user} onUserUpdate={onUserUpdate}/>
      </div>
    </div>
  );
}
