// matcha/src/components/MenuDesktop.tsx
"use client";
import { PublicUser } from "@/lib/types";
import Link from "next/link";
import { Users, Search, Heart, MessageCircle, User, LogOut } from "lucide-react";

export default function MenuDesktop({
  user,
  onLogout,
}: {
  user: PublicUser;
  onLogout: () => void;
}) {
  const links = [
    { href: "/", label: "Browse", icon: <Users size={18} /> },
    { href: "/search", label: "Search", icon: <Search size={18} /> },
    { href: "/likes", label: "Likes", icon: <Heart size={18} /> },
    { href: "/chat", label: "Chat", icon: <MessageCircle size={18} /> },
    { href: "/profile", label: "Profile", icon: <User size={18} /> },
  ];

  return (
    <nav className="hidden md:flex items-center gap-3">
      {links.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 px-4 py-2 text-fuchsia-100 hover:text-white hover:bg-pink-600/30 rounded-xl transition-all duration-200 transform hover:scale-105
                    focus:outline-none focus:ring-1 focus:ring-pink-600 transition duration-150"
        >
          {icon}
          <span className="text-base font-medium">{label}</span>
        </Link>
      ))}

      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-4 py-2 text-fuchsia-100 hover:text-white hover:bg-pink-600/30 rounded-xl transition-all duration-200 transform hover:scale-105
                  focus:outline-none focus:ring-1 focus:ring-pink-600 transition duration-150"
      >
        <LogOut size={18} />
        <span className="text-base font-medium">Logout</span>
      </button>
    </nav>
  );
}