"use client";

import { useState, useEffect } from "react";
import { User } from "@/lib/db/users";
import MainPic from "@/components/pics/MainPic";

async function fetchPics(userId: string) {
  const res = await fetch(`/api/allpics/${userId}`);
  if (!res.ok)
    return [];
  return await res.json();
}

export function UserModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [pics, setPics] = useState<
    { id: number; mime_type: string; data: string; is_main: boolean }[]
  >([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchPics(user.id).then(setPics);
  }, [user.id]);

  if (pics.length === 0) return null; // ou un loader

  function nextPic() {
    setCurrent((prev) => (prev + 1) % pics.length);
  }

  function prevPic() {
    setCurrent((prev) => (prev - 1 + pics.length) % pics.length);
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 bg-black/30"
      onClick={onClose} // clic sur l'overlay -> ferme le modal
    >
      <div
        className="bg-white rounded-lg p-6 w-96 relative"
        onClick={(e) => e.stopPropagation()} // bloque le clic à l'intérieur
      >
        <h2 className="text-xl font-bold text-pink-700">{user.username}</h2>

        {/* Image actuelle */}
        <img
          src={`data:${pics[current].mime_type};base64,${pics[current].data}`}
          alt={`photo ${current + 1}`}
          className="rounded-lg shadow-md w-full object-cover my-2"
        />

        {/* Navigation */}
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

        <p className="text-gray-700 mt-2">{user.bio}</p>
        <p className="text-sm text-gray-400">{user.city}</p>

        <button
          className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition mt-4"
          onClick={(e) => {
            e.stopPropagation();
            console.log("Liked user:", user.id);
          }}
        >
          Like
        </button>
      </div>
    </div>
  );
}

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
        <button
          className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition"
          onClick={(e) => { handleLike(e); }}
        >
          Like
        </button>
      </div>

      {open && <UserModal user={user} onClose={() => setOpen(false)} />}
    </>
  );
}