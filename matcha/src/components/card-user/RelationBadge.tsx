// src/components/card-user/RelationBadge.tsx

import { LikeStatus } from "@/lib/types";

// Text legend of the card colour, from the viewer's point of view
const BADGE: Partial<Record<LikeStatus, { label: string; title: string; className: string }>> = {
  match: {
    label: "💬 Connected",
    title: "You like each other: you can chat",
    className: "bg-pink-600 text-white",
  },
  isLiked: {
    label: "♥ Likes you",
    title: "Like back to get connected",
    className: "bg-teal-600 text-white",
  },
  like: {
    label: "♡ You like them",
    title: "Waiting for them to like you back",
    className: "bg-white text-pink-700 border border-pink-300",
  },
};

export default function RelationBadge({ status, className = "" }: { status: LikeStatus; className?: string }) {
  const badge = BADGE[status];
  if (!badge) return null;
  return (
    <span
      title={badge.title}
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.className} ${className}`}
    >
      {badge.label}
    </span>
  );
}
