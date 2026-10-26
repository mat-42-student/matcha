// components/Header.tsx
"use client";

import { useMe } from "@/context/UserContext";
import { useSocket } from "@/context/SocketContext";
import MenuDesktop from "./MenuDesktop";
import MenuMobile from "./MenuMobile";
import NotificationBell from "./NotificationBell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function Header() {
  const { me, setMe } = useMe();
  const { socket } = useSocket();
  const router = useRouter();

  async function handleLogout() {
    // closed first: the server closes the session's sockets, which in this tab must not read as "session ended"
    socket?.disconnect();
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setMe(null);
    toast.success("Bye 👋");
    router.push("/auth");
  }

  return (
    <header className="w-full bg-pink-800 shadow p-4 flex items-center">
      <Link href="/" className="text-xl font-bold text-white">
        Matcha 🍵
      </Link>

      <div className="ml-auto flex items-center gap-4">
        {me ? (
          <>
            <NotificationBell />
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
      </div>
    </header>
  );
}