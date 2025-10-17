// matcha/src/components/like/LButton.tsx
"use client";

import { LikeTabsTypes } from "@/lib/types";

type LButtonProps = {
  tab: LikeTabsTypes;
  activeTab: LikeTabsTypes;
  setActiveTab: (tab: LikeTabsTypes) => void;
  children: React.ReactNode;
};

export default function LButton({ tab, activeTab, setActiveTab, children }: LButtonProps) {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 px-4 py-2 transition ${
        isActive
          ? "border-b-2 border-pink-400 text-pink-400 font-semibold"
          : "hover:text-pink-300"
      }`}
    >
      {children}
    </button>
  );
}
