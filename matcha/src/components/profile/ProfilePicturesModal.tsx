"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Star, Trash2, Upload } from "lucide-react";
import toast from 'react-hot-toast';

export function ProfilePicturesModal({
  userId,
  onClose,
  onUpdated,
}: {
  userId: string;
  onClose: () => void;
  onUpdated?: () => void;
}) {
    const [pictures, setPictures] = useState<any[]>([]);

    const fetchPics = async () => {
        try {
        const res = await fetch(`/api/me/pictures`);
        if (!res.ok || res.status === 204) {
            setPictures([]);
            return;
        }

        const data = await res.json();
        setPictures(data);
        } catch (err) {
        console.error("Erreur lors du chargement des photos:", err);
        setPictures([]);
        }
    };

    useEffect(() => {
        fetchPics();
    }, [userId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`/api/me/pictures`, {
            method: "POST",
            body: formData,
            });

            if (res.ok) {
                const newPic = await res.json();
                setPictures((prev) => [newPic, ...prev]);
                e.target.value = "";
                toast.success("Photo added !");
                onUpdated && onUpdated();
            } else {
                toast.error("Error during picture upload");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error during upload");
        }
    };

    const handleDelete = async (id: string) => {
    try {
        const res = await fetch(`/api/me/pictures/${id}`, { method: "DELETE" });
        if (res.ok) {
        toast.success("Picture deleted !");
        await fetchPics();
        onUpdated && onUpdated();
        } else {
        toast.error("Error during suppression !");
        }
    } catch (err) {
        console.error(err);
        toast.error("Network error !");
    }
    };

    const handleSetMain = async (id: string) => {
    try {
        const res = await fetch(`/api/me/pictures/${id}/main`, {
        method: "PUT",
        });

        if (res.ok) {
        toast.success("Main picture updated !");
        await fetchPics();
        onUpdated && onUpdated();
        } else {
        toast.error("Error during update !");
        }
    } catch (err) {
        console.error(err);
        toast.error("Network error !");
    }
    };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl relative">
        {/* closing button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Edit my photos
        </h2>

        {/* pictures area */}
        <div className="flex overflow-x-auto gap-4 p-4 scrollbar-thin scrollbar-thumb-pink-300">
        {pictures.length > 0 ? (
            [...pictures] // duplicating to avoid state modification
            .sort((a, b) => (a.is_main === b.is_main ? 0 : a.is_main ? -1 : 1)) // putting the main in first position
            .map((pic) => (
                <div
                key={pic.id}
                className={`relative flex-shrink-0 group w-60 h-60 rounded-lg overflow-hidden shadow-sm transition
                    ${pic.is_main
                    ? "ring-4 ring-pink-400 border-pink-400 scale-105"
                    : "border border-gray-200 hover:ring-2 hover:ring-pink-200"
                    }`}
                >
                <Image
                    src={`data:${pic.mime_type};base64,${pic.data}`}
                    alt="photo"
                    fill
                    className="object-cover"
                />

                {pic.is_main && (
                    <div className="absolute top-2 left-2 bg-pink-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                    ⭐ Main
                    </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                    {!pic.is_main && (
                    <button
                        onClick={() => handleSetMain(pic.id)}
                        className="bg-white p-1.5 rounded-full hover:bg-pink-100"
                        title="Définir comme principale"
                    >
                        <Star className="text-yellow-400" size={18} />
                    </button>
                    )}
                    <button
                    onClick={() => handleDelete(pic.id)}
                    className="bg-white p-1.5 rounded-full hover:bg-pink-100"
                    title="Supprimer"
                    >
                    <Trash2 className="text-red-500" size={18} />
                    </button>
                </div>
                </div>
            ))
        ) : (
            <div className="flex flex-col items-center justify-center w-full text-gray-500">
              <Image
                src="/avatars/default.svg"
                alt="avatar par défaut"
                width={100}
                height={100}
              />
              <p className="mt-2 text-sm">No photos at this time</p>
            </div>
          )}

          {/* upload button */}
          <label className="flex flex-col items-center justify-center flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg w-60 h-60 cursor-pointer hover:bg-gray-50">
            <Upload className="text-gray-400 mb-2" />
            <span className="text-gray-500 text-sm">Add</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
}