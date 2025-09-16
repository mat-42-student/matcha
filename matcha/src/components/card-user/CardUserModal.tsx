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
}: {
  user: PublicUser;
  onClose: () => void;
}) {
  const [pics, setPics] = useState<
    { id: number; mime_type: string; data: string; is_main: boolean }[]
  >([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchPics(user.id).then(setPics);
  }, [user.id]);

  // if (pics.length === 0) return null;

  function nextPic() {
    setCurrent((prev) => (prev + 1) % pics.length);
  }

  function prevPic() {
    setCurrent((prev) => (prev - 1 + pics.length) % pics.length);
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 bg-black/30"
      onClick={onClose} // a click closes the modal
    >
      <div
        className="bg-white rounded-lg p-6 w-96 relative"
        onClick={(e) => e.stopPropagation()} // don't close if click was inside modal
      >
        <h2 className="text-xl font-bold text-pink-700">{user.username}</h2>

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

        <LikeButton user={user} />
      </div>
    </div>
  );
}
