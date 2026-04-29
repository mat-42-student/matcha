// matcha/src/components/MenuMobile.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { PublicUser } from "@/lib/types";
import {
  Menu,
  X,
  Users,
  Search,
  Heart,
  MessageCircle,
  User,
  LogOut,
} from "lucide-react";

export default function MenuMobile({
  user,
  onLogout,
}: {
  user: PublicUser;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Browse", icon: <Users size={18} /> },
    { href: "/search", label: "Search", icon: <Search size={18} /> },
    { href: "/likes", label: "My links", icon: <Heart size={18} /> },
    { href: "/chat", label: "Chat", icon: <MessageCircle size={18} /> },
    { href: "/profile", label: user.first_name, icon: <User size={18} /> },
  ];

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-white p-2 rounded-md hover:bg-pink-700/40 transition"
        aria-label="Toggle menu"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <nav className="absolute right-0 top-full mt-2 w-56 bg-pink-700 rounded-xl shadow-lg flex flex-col gap-1 p-3 z-50 animate-fadeIn">
          {links.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-fuchsia-100 rounded-md hover:bg-pink-800 hover:text-white transition-all duration-150"
            >
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
          <button
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
            className="flex items-center gap-3 px-3 py-2 text-fuchsia-100 rounded-md hover:bg-pink-800 hover:text-white transition-all duration-150"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>
      )}
    </div>
  );
}