"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        router.push("/auth"); // redirige vers la page de connexion
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-2xl shadow-md flex flex-col gap-4 w-96"
    >
      <h1 className="text-2xl font-bold text-center text-pink-700">
        Créer un compte
      </h1>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900" 
        />

        <input 
            name="password" 
            type="password" 
            placeholder="Mot de passe" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900"
        />

        <input 
            name="username" 
            type="text" 
            placeholder="Nom d'utilisateur" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900"
        />

        <input 
            name="city" 
            type="text" 
            placeholder="Ville" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900" 
        />

        <select 
            name="gender" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900"
        >
            <option value="">-- Sélectionnez votre genre --</option>
            <option value="M">Homme</option>
            <option value="F">Femme</option>
            <option value="O">Autre</option>
        </select>

        <select 
            name="sex_pref" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900"
        >
            <option value="">-- Préférence --</option>
            <option value="M">Hommes</option>
            <option value="F">Femmes</option>
            <option value="B">Les deux</option>
        </select>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-50"
      >
        {loading ? "Inscription..." : "S'inscrire"}
      </button>
    </form>
  );
}