// components/Header.tsx
"use client";

import { useUser } from "@/context/UserContext";
import Link from "next/link";

export function Header() {
  const { user, setUser } = useUser();

  // Fonction logout
  async function handleLogout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setUser(null); // 🔑 met à jour le context, tous les composants abonnés se rerendent
    window.location.href = "/auth"; // redirection
  }

  return (
    <header className="w-full bg-pink-800 shadow p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
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
            <Link href="/auth">Login</Link>
            <Link href="/signup" className="font-semibold text-orange-200">
              Signup
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}