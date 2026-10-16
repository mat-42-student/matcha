"use client";
import { useState, useCallback } from "react";
import Image from "next/image";
import { Edit2 } from "lucide-react";
import { ProfilePicturesModal } from "./ProfilePicturesModal";
import { DEFAULT_AVATAR } from "@/lib/pictureUrl";

interface ProfilePictureProps {
  userId: string;
  onUpdated?: () => void; // ✅ callback externe
}

export default function ProfilePicture({ userId, onUpdated }: ProfilePictureProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  // Bumped after each change so the browser asks again which picture is main
  const [version, setVersion] = useState(0);

  const handleUpdated = useCallback(() => {
    onUpdated?.();
    setVersion((v) => v + 1);
    setHasError(false);
  }, [onUpdated]);

  const imageSrc = hasError ? DEFAULT_AVATAR : `/api/me/pictures/main?v=${version}`;

  return (
    <div
      className="relative w-48 h-48 mx-auto mt-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={imageSrc}
        alt="Profile picture"
        fill
        unoptimized
        className="object-cover rounded-full border-4 border-pink-300 shadow-lg cursor-pointer transition"
        onClick={() => setIsModalOpen(true)}
        onError={() => setHasError(true)}
        priority
      />

      {isHovered && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute bottom-2 right-2 bg-pink-600 text-white rounded-full p-2 shadow-lg hover:bg-pink-700 transition"
        >
          <Edit2 size={18} />
        </button>
      )}

      {isModalOpen && (
        <ProfilePicturesModal
          userId={userId}
          onClose={() => setIsModalOpen(false)}
          onUpdated={handleUpdated} // ✅ combine les deux logiques
        />
      )}
    </div>
  );
}