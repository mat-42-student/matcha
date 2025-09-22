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
            <Link href="/" className="px-4 py-2 text-fuchsia-100 hover:text-pink-950 duration-500">
              👥 Me@t
            </Link>
            <Link href="/search" className="px-4 py-2 text-fuchsia-100 hover:text-pink-950 duration-500">
              🔍 Search
            </Link>
            <Link href="/likes" className="px-4 py-2 text-fuchsia-100 hover:text-pink-950 duration-500">
              ❤️ Likes
            </Link>
            <Link href="/chat" className="px-4 py-2 text-fuchsia-100 hover:text-pink-950 duration-500">
              🗨️ Chat
            </Link>
            <Link href="/profile" className="px-4 py-2 text-fuchsia-100 hover:text-pink-950 duration-500">
              👤 {user.username}
            </Link>
            <Link
              href="#"
              onClick={handleLogout}
              className="px-4 py-2 text-fuchsia-100 hover:text-pink-950 duration-500"
            >
              👋 Logout
            </Link>
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