"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur inconnue");
      } else {
        router.push("/auth");
      }
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form 
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md flex flex-col gap-4 w-96"
      >
        <h1 className="text-2xl font-bold text-center text-pink-700">
          Créer un compte
        </h1>

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        {/* Email */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="px-4 py-2 rounded-full border border-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-pink-400
                     placeholder-gray-400
                     text-gray-900"
          required
        />

        {/* Mot de passe */}
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          className="px-4 py-2 rounded-full border border-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-pink-400
                     placeholder-gray-400
                     text-gray-900"
          required
        />

        {/* Nom d'utilisateur */}
        <input
          type="text"
          name="username"
          placeholder="Nom d'utilisateur"
          className="px-4 py-2 rounded-full border border-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-pink-400
                     placeholder-gray-400
                     text-gray-900"
          required
        />

        {/* Ville */}
        <input
          type="text"
          name="city"
          placeholder="Ville"
          className="px-4 py-2 rounded-full border border-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-pink-400
                     placeholder-gray-400
                     text-gray-900"
          required
        />

        {/* Genre */}
        <select
          name="gender"
          className="px-4 py-2 rounded-full border border-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-pink-400
                     text-gray-900"
          required
        >
          <option value="">-- Sélectionnez votre genre --</option>
          <option value="M">Homme</option>
          <option value="F">Femme</option>
          <option value="O">Autre</option>
        </select>

        {/* Préférence sexuelle */}
        <select
          name="sex_pref"
          className="px-4 py-2 rounded-full border border-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-pink-400
                     text-gray-900"
          required
        >
          <option value="">-- Préférence --</option>
          <option value="M">Hommes</option>
          <option value="F">Femmes</option>
          <option value="B">Les deux</option>
        </select>

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold 
                     hover:bg-pink-700 transition disabled:opacity-50"
        >
          {loading ? "Inscription..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
}