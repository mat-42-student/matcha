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
            <Link href="/profile">Profil</Link>
            <button
              onClick={handleLogout}
              className="text-fuchsia-200 hover:underline"
            >
              Logout
            </button>
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