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
        setError(data.error || "Unknown error");
      } else {
        router.push("/auth"); // redirige vers la page de connexion
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
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
        Create an account
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
            placeholder="password" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900"
        />

        <input 
            name="first_name" 
            type="text" 
            placeholder="First Name" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900"
        />
        <input 
            name="last_name" 
            type="text" 
            placeholder="Last Name" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900"
        />

        <input 
            name="birthdate" 
            type="date" 
            required 
            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900"
        />

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-50"
      >
        {loading ? "Signing up..." : "Sign up"}
      </button>
    </form>
  );
}