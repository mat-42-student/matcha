"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur inconnue");
        setLoading(false);
        return;
      }

      // ✅ Succès → redirection côté client
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <input
        type="email"
        name="email"
        placeholder="Email"
        className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-50"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Mot de passe"
        className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-50"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-pink-600 text-white rounded-lg py-2 hover:bg-pink-700 disabled:opacity-50"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
