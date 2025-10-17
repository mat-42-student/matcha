// matcha/src/components/MenuDesktop.tsx
"use client"

import { PublicUser } from "@/lib/types";
import Link from "next/link"

export default function MenuDesktop({ user, onLogout }: { user: PublicUser; onLogout: () => void }) {
  // console.log("USER:", user, typeof user);
  return (
    <nav className="hidden md:flex gap-4">
      <Link href="/" className="px-4 py-2 text-fuchsia-100 hover:text-pink-50 transition">
        👥 Me@t
      </Link>
      <Link href="/search" className="px-4 py-2 text-fuchsia-100 hover:text-pink-50 transition">
        🔍 Search
      </Link>
      <Link href="/likes" className="px-4 py-2 text-fuchsia-100 hover:text-pink-50 transition">
        ❤️ Likes
      </Link>
      <Link href="/chat" className="px-4 py-2 text-fuchsia-100 hover:text-pink-50 transition">
        🗨️ Chat
      </Link>
      <Link href="/profile" className="px-4 py-2 text-fuchsia-100 hover:text-pink-50 transition">
        👤 Profile
      </Link>
      <button
        onClick={onLogout}
        className="px-4 py-2 text-fuchsia-100 hover:text-pink-50 transition"
      >
        👋 Logout
      </button>
    </nav>
  );
}
