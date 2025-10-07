"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Edit2 } from "lucide-react";
import { ProfilePicturesModal } from "./ProfilePicturesModal";

export default function ProfilePicture({ userId }: { userId: string }) {
  const [mainPic, setMainPic] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function fetchMainPic() {
      try {

        const res = await fetch(`/api/me/pictures/main`);
   
        if (res.status === 204) {
          setMainPic(null);
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        if (data?.data) {
          setMainPic(`data:${data.mime_type};base64,${data.data}`);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de la photo :", err);
        setHasError(true);
      }
    }
    fetchMainPic();
  }, [userId]);

  const imageSrc =
    !hasError && mainPic
      ? mainPic
      : "/avatars/default.svg";

  return (
    <div
      className="relative w-48 h-48 mx-auto mt-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={imageSrc}
        alt="Photo de profil"
        fill
        className="object-cover rounded-full border-4 border-pink-300 shadow-lg cursor-pointer transition"
        onClick={() => setIsModalOpen(true)}
        onError={() => setHasError(true)}
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
        />
      )}
    </div>
  );
}