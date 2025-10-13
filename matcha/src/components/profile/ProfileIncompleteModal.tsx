"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfileIncompleteModal({ missing }: { missing: string[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Petite animation de délai pour l’apparition
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 text-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Profil incomplet
        </h2>
        <p className="text-gray-600 mb-6">
          Vous devez compléter votre profil pour pouvoir matcher.
        </p>

        {missing.length > 0 && (
          <ul className="text-sm text-gray-500 mb-6">
            {missing.map((f) => (
              <li key={f}>• {fieldLabel(f)}</li>
            ))}
          </ul>
        )}

        <button
          onClick={() => router.push("/profile")}
          className="px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition"
        >
          Compléter mon profil
        </button>
      </div>
    </div>
  );
}

function fieldLabel(field: string) {
  switch (field) {
    case "gender": return "Genre";
    case "birthdate": return "Date de naissance";
    case "bio": return "Bio";
    case "location": return "Localisation";
    case "picture": return "Photo de profil";
    default: return field;
  }
}