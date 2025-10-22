// components/Header.tsx
"use client";

import { useUser } from "@/context/UserContext";
import MenuDesktop from "./MenuDesktop";
import MenuMobile from "./MenuMobile";
import Link from "next/link";

export function Header() {
  const { me, setMe } = useUser();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setMe(null);
    window.location.href = "/auth";
  }

  return (
    <header className="w-full bg-pink-800 shadow p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold text-white">
        Matcha 🍵
      </Link>

      {me ? (
        <>
          <MenuDesktop user={me} onLogout={handleLogout} />
          <MenuMobile user={me} onLogout={handleLogout} />
        </>
      ) : (
        <div className="flex gap-4">
          <Link href="/auth" className="text-white hover:text-pink-200 transition">
            Login
          </Link>
          <Link href="/signup" className="font-semibold text-orange-200 hover:text-orange-100 transition">
            Signup
          </Link>
        </div>
      )}
    </header>
  );
}