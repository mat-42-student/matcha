// matcha/src/components/header/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

export default function NotificationBell() {
  const { notifications, removeNotification } = useSocket();
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [exitingIds, setExitingIds] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.length;

  // Fermer la dropdown si clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = async (notificationId: number) => {
    try {
      setExitingIds((prev) => new Set(prev).add(notificationId));
      setDeletingId(notificationId);
      // Let the exit animation play before removing from server/state.
      await new Promise((resolve) => setTimeout(resolve, 220));
      await removeNotification(notificationId);
    } catch {
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
      toast.error("Impossible de supprimer cette notification");
    } finally {
      setDeletingId(null);
    }
  };

  return (
  <div className="relative inline-block">
    {/* 🔔 Icon button */}
    <button
      onClick={() => setOpen(!open)}
      className="relative p-2 rounded-full hover:bg-pink-700 transition-colors"
    >
      <Bell className="w-6 h-6 text-white" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>

    {/* 🧩 Dropdown */}
    {open && (
      <div className="absolute right-0 md:right-auto md:left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">Aucune notification</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-pink-50 transition-all duration-200 ease-out ${
                  exitingIds.has(notif.id) ? "opacity-0 -translate-x-2 scale-[0.98]" : "opacity-100 translate-x-0 scale-100"
                }`}
              >
                {notif.sender_picture ? (
                  <Image
                    src={notif.sender_picture}
                    alt={notif.sender_username || "User"}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-pink-300 flex items-center justify-center text-white font-bold">
                    {notif.sender_username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <p className="text-sm text-gray-800">{notif.message}</p>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(notif.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notif.id);
                  }}
                  disabled={deletingId === notif.id}
                  className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Supprimer la notification"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <div className="text-center text-sm text-pink-700 py-2 hover:bg-pink-100 cursor-pointer transition-colors">
            Voir tout
          </div>
        )}
      </div>
    )}
  </div>
  );
}