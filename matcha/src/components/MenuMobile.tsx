
import Link from "next/link"
import { useState } from "react";
import { PublicUser } from "@/types";

export default function MenuMobile({ user, onLogout }: { user: PublicUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-white text-2xl focus:outline-none"
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {open && (
        <nav className="absolute right-0 top-full mt-2 w-48 bg-pink-700 rounded shadow-lg flex flex-col gap-2 p-4 z-50">
          <Link href="/" className="px-2 py-1 text-fuchsia-100 hover:bg-pink-800" onClick={() => setOpen(false)}>
            👥 Me@t
          </Link>
          <Link href="/search" className="px-2 py-1 text-fuchsia-100 hover:bg-pink-800 transition" onClick={() => setOpen(false)}>
            🔍 Search
          </Link>
          <Link href="/likes" className="px-2 py-1 text-fuchsia-100 hover:bg-pink-800 transition" onClick={() => setOpen(false)}>
            ❤️ Likes
          </Link>
          <Link href="/chat" className="px-2 py-1 text-fuchsia-100 hover:bg-pink-800 transition" onClick={() => setOpen(false)}>
            🗨️ Chat
          </Link>
          <Link href="/profile" className="px-2 py-1 text-fuchsia-100 hover:bg-pink-800 transition" onClick={() => setOpen(false)}>
            👤 {user.first_name}
          </Link>
          <button
            onClick={() => { onLogout(); setOpen(false); }}
            className="px-2 py-1 text-fuchsia-100 hover:bg-pink-800 transition text-left"
          >
            👋 Logout
          </button>
        </nav>
      )}
    </div>
  );
}
