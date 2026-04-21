// matcha/src/components/MenuDesktop.tsx
"use client";
import { PublicUser } from "@/lib/types";
import Link from "next/link";
import { Users, Search, Heart, MessageCircle, User, LogOut } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

export default function MenuDesktop({
  user,
  onLogout,
}: {
  user: PublicUser;
  onLogout: () => void;
}) {
  const { unreadMessages } = useSocket();
  const unreadCount = [...unreadMessages.values()].reduce((sum, count) => sum + count, 0);
  const links = [
    { href: "/", label: "Browse", icon: <Users size={18} /> },
    { href: "/search", label: "Search", icon: <Search size={18} /> },
    { href: "/likes", label: "Likes", icon: <Heart size={18} /> },
    { href: "/profile", label: user.first_name, icon: <User size={18} /> },
  ];
  const classname = "flex items-center gap-2 px-4 py-2 text-fuchsia-100 hover:text-white hover:bg-pink-600/30 rounded-xl transform hover:scale-105 focus:outline-none focus:ring-1 focus:ring-pink-600 transition duration-150";

  return (
    <nav className="hidden md:flex items-center gap-3">
      {links.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className={classname}
        >
          {icon}
          <span className="text-base font-medium">{label}</span>
        </Link>
      ))}
        <Link
          key="/chat"
          href="/chat"
          className={classname}
        >
          <span className="relative">
            <MessageCircle size={18} />
            {unreadCount > 0 && <span 
              className="absolute inline-flex items-center justify-center 
                          w-4 h-4 text-xs font-bold text-white bg-pink-700 border-2 border-white 
                          rounded-full -top-2 -right-2 z-10"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>}
          </span>
          <span className="text-base font-medium">Chat</span>
        </Link>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-4 py-2 text-fuchsia-100 hover:text-white hover:bg-pink-600/30 rounded-xl transition-all duration-200 transform hover:scale-105
                  focus:outline-none focus:ring-1 focus:ring-pink-600"
      >
        <LogOut size={18} />
        <span className="text-base font-medium">Logout</span>
      </button>
    </nav>
  );
}