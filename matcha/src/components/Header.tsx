// components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { PublicUser } from "@/types";

export function Header({ initialUser }: { initialUser: PublicUser | null }) {
  const [user, setUser] = useState<PublicUser | null>(initialUser);

  // Fallback si initialUser est null au premier rendu (par ex après un login client-side)
  useEffect(() => {
    if (!initialUser) {
      async function fetchUser() {
        try {
          const res = await fetch("/api/me", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          }
        } catch (err) {
          console.error("Erreur Header fetchUser:", err);
        }
      }

      fetchUser();

      // Event global pour rafraîchir l'état utilisateur
      const refreshUser = () => fetchUser();
      window.addEventListener("user-logged-in", refreshUser);

      return () => window.removeEventListener("user-logged-in", refreshUser);
    }
  }, [initialUser]);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setUser(null);
    window.location.href = "/auth"; // redirige vers login
  }

  return (
    <header className="w-full bg-pink-800 shadow p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold text-white">
        Matcha 🍵
      </Link>

      <nav className="flex gap-4">
        {user ? (
          <>
            <span>Hi, {user.username}</span>
            <Link href="/profile" className="text-fuchsia-100 hover:underline">
              Profil
            </Link>
            <button
              onClick={handleLogout}
              className="text-fuchsia-200 hover:underline"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth" className="text-fuchsia-100 hover:underline">
              Login
            </Link>
            <Link href="/signup" className="font-semibold text-orange-200">
              Signup
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}