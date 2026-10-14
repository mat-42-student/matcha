"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Edit2 } from "lucide-react";
import { ProfilePicturesModal } from "./ProfilePicturesModal";

interface ProfilePictureProps {
  userId: string;
  onUpdated?: () => void; // ✅ callback externe
}

// Returns the main picture as a data url, or null if the user has none
async function loadMainPic(): Promise<string | null> {
  const res = await fetch(`/api/me/pictures/main`);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data?.data ? `data:${data.mime_type};base64,${data.data}` : null;
}

export default function ProfilePicture({ userId, onUpdated }: ProfilePictureProps) {
  const [mainPic, setMainPic] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Ignore the response if the component unmounted in the meantime
    let cancelled = false;

    (async () => {
      try {
        const src = await loadMainPic();
        if (!cancelled) setMainPic(src);
      } catch (err) {
        console.error("Erreur lors du chargement de la photo :", err);
        if (!cancelled) setHasError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleUpdated = useCallback(async () => {
    onUpdated?.();
    try {
      setMainPic(await loadMainPic());
      setHasError(false);
    } catch (err) {
      console.error("Erreur lors du chargement de la photo :", err);
      setHasError(true);
    }
  }, [onUpdated]);

  const imageSrc = !hasError && mainPic ? mainPic : "/avatars/default.svg";

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