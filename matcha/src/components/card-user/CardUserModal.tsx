// src/components/card-user/CardUserModal.tsx

"use client"

import { useState, useEffect } from "react";
import { PublicUser, Picture } from "@/lib/types";
import Image from "next/image";
import LikeButton from "./LikeButton";

export default function CardUserModal({
  user,
  mainPic,
  onClose,
  onUserUpdate,
}: {
  user: PublicUser;
  mainPic: Picture;
  onClose: () => void;
  onUserUpdate: (u: PublicUser) => void;
}) {

  // State for all pictures (main + others)
  const [pics, setPics] = useState<Picture[]>([mainPic]);
  const [current, setCurrent] = useState(0);

  // Fetch all other pictures
  useEffect(() => { 
    async function fetchAllPics() {
      try {
        const res = await fetch(`/api/users/${user.id}/allpics`);
        if (!res.ok || res.status === 204) return [];

        const picsJson: Picture[] = await res.json();
        // Convert base64 to data URL for each picture
        return picsJson.map(pic => ({
          ...pic,
          data: `data:${pic.mime_type};base64,${pic.data}`
        }));
      } catch (err) {
        console.error("Could not retrieve all pictures:", err);
        return [];
      }
    }

    async function loadPics() {
      const extraPics = await fetchAllPics();
      setPics([{
        ...mainPic,
        data: `data:${mainPic.mime_type};base64,${mainPic.data}`
      }, ...extraPics]);
    }

    loadPics();
  }, [user.id, mainPic]);

  // Navigation
  function nextPic() {
    if (current < pics.length - 1) setCurrent(current + 1);
  }

  function prevPic() {
    if (current > 0) setCurrent(current - 1);
  }

  // Report / Block actions
  async function reportUser() {
    if (confirm("Do you really want to report this user ?")) {
      await fetch(`/api/users/${user.id}/report`, { method: 'POST' });
    }
  }

  async function blockUser() {
    if (!confirm("Do you really want to block this user?")) return;
    await fetch(`/api/match/${user.id}/block`, { method: 'POST' });
    onUserUpdate(user);
    onClose();
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
            <span className="text-xl text-pink-700 font-semibold">{user.first_name}</span>
            <span className="text-sm text-gray-400"> ({user.gender}) </span>
            <span className="text-sm text-gray-600">{user.age} ans</span>
          </div>
          <span className="text-sm text-gray-600" title="Fame">⭐{user.fame}</span>
        </div>

        {pics.length > 0 && (
          <>
            <Image
              unoptimized
              width={0}
              height={0}
              style={{ width: "auto", height: "auto" }}
              src={pics[current].data}
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
                disabled={current === pics.length - 1}
              >
                ▶
              </button>
            </div>
          </>
        )}

        <p className="text-gray-700 mt-2">{user.bio}</p>
        <p className="text-sm text-gray-400">{user.city}</p>

        <div className="flex justify-between mt-4">
          <LikeButton user={user} onUserUpdate={onUserUpdate} />
          <span className="flex">
            <button onClick={blockUser} title="Block user" className="px-2 text-xl">⛔</button>
            <button onClick={reportUser} title="Report user" className="px-2 text-xl">🚨</button>
          </span>
        </div>
      </div>
    </div>
  );
}