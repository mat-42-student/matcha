"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Star, Trash2, Upload } from "lucide-react";

export function ProfilePicturesModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [pictures, setPictures] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
    async function fetchPics() {
        try {
        const res = await fetch(`/api/me/pictures`);
        if (!res.ok) {
            console.warn("Erreur lors du chargement des photos:", res.status);
            setPictures([]); // Aucun résultat
            return;
        }

        // Vérifie qu’il y a bien du contenu avant de parser
        const text = await res.text();
        if (!text) {
            setPictures([]); // Pas de photo = cas normal
            return;
        }

        const data = JSON.parse(text);
        setPictures(data);
        } catch (err) {
        console.error("Erreur lors du chargement des photos:", err);
        setPictures([]);
        }
    }

    fetchPics();
    }, [userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    await fetch(`/api/me/pictures`, {
      method: "POST",
      body: formData,
    });

    setHasChanges(true);
    location.reload();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/me/pictures/${id}`, {
      method: "DELETE",
    });
    setPictures((prev) => prev.filter((pic) => pic.id !== id));
    setHasChanges(true);
  };

  const handleSetMain = async (id: string) => {
    await fetch(`/api/me/pictures/${id}/main`, {
      method: "PUT",
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onClose();
    if (hasChanges) window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl relative">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Modifier mes photos
        </h2>

        {/* Zone du carrousel */}
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-pink-300">
          {pictures.length > 0 ? (
            pictures.map((pic) => (
              <div
                key={pic.id}
                className="relative flex-shrink-0 group w-40 h-40 rounded-lg overflow-hidden border shadow-sm"
              >
                <Image
                  src={`data:${pic.mime_type};base64,${pic.data}`}
                  alt="photo"
                  fill
                  className="object-cover"
                />
                {/* Boutons superposés */}
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleSetMain(pic.id)}
                    className="bg-white p-1.5 rounded-full hover:bg-pink-100"
                    title="Définir comme principale"
                  >
                    <Star className="text-yellow-400" size={18} />
                  </button>
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
              <p className="mt-2 text-sm">Aucune photo pour le moment</p>
            </div>
          )}

          {/* Bouton d’upload */}
          <label className="flex flex-col items-center justify-center flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg w-40 h-40 cursor-pointer hover:bg-gray-50">
            <Upload className="text-gray-400 mb-2" />
            <span className="text-gray-500 text-sm">Ajouter</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
            />
          </label>
        </div>

        {/* Bouton Sauvegarder */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}