// matcha/src/components/card-user/CardUserModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Picture, PublicUser } from "@/lib/types";
import { pictureUrl } from "@/lib/pictureUrl";
import Image from "next/image";
import LikeButton from "./LikeButton";
import { useUsersStore } from "@/context/UsersStore";
import toast from "react-hot-toast";

export default function CardUserModal({
  mainPic,
  user,
  onClose,
}: {
  mainPic: string;
  user: PublicUser;
  onClose: () => void;
}) {
  const { updateUser } = useUsersStore();
  const [pics, setPics] = useState<string[]>([mainPic]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Ignore the response if the modal closed in the meantime
    let cancelled = false;

    async function loadPics() {
      try {
        const res = await fetch(`/api/users/${user.id}/allpics`);
        if (!res.ok || res.status === 204) return;
        const extraPics: Picture[] = await res.json();
        if (!cancelled) setPics([mainPic, ...extraPics.map((pic) => pictureUrl(pic.id))]);
      } catch (err) {
        console.error("Could not retrieve all pictures:", err);
      }
    }

    loadPics();
    return () => {
      cancelled = true;
    };
  }, [user.id, mainPic]);

  function nextPic() {
    setCurrent((prev) => Math.min(prev + 1, pics.length - 1));
  }

  function prevPic() {
    setCurrent((prev) => Math.max(prev - 1, 0));
  }

  async function reportUser() {
    if (!confirm("Report this user as a fake account ? They will also be blocked.")) return;
    const res = await fetch(`/api/users/${user.id}/report`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Something went wrong");
      return;
    }
    toast.success("User reported");
    const updatedUser: PublicUser = { ...user, likeStatus: 'block' };
    updateUser(updatedUser);
    onClose();
  }

  async function blockUser() {
    if (!confirm("Do you really want to block this user ?")) return;
    const res = await fetch(`/api/match/${user.id}/block`, { method: 'POST' });
    if (res.ok) {
      const updatedUser: PublicUser = { ...user, likeStatus: 'block' };
      updateUser(updatedUser);
    }
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
            <div className="text-xs text-gray-500">@{user.username}</div>
          </div>
          <span className="text-sm text-gray-600" title="Fame">
            ⭐{user.fame}
          </span>
        </div>

        {pics.length > 0 && (
          <>
            <Image
              unoptimized
              width={0}
              height={0}
              style={{ width: "auto", height: "auto" }}
              src={pics[current]}
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
          <LikeButton user={user} />
          <span className="flex">
            <button
              onClick={blockUser}
              title="Block user"
              className="px-2.5 py-1 text-xl rounded-md border border-transparent text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors duration-150 cursor-pointer"
            >
              ⛔
            </button>
            <button
              onClick={reportUser}
              title="Report user"
              className="px-2.5 py-1 text-xl rounded-md border border-transparent text-gray-500 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition-colors duration-150 cursor-pointer"
            >
              🚨
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}