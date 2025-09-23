// matcha/src/app/likes/page.tsx
"use client";

import { useState } from "react";
import Liked from "@/components/like/Liked";
import LikeMe from "@/components/like/LikeMe";
import Matches from "@/components/like/Matches";

export default function LikeTabs() {
  const [activeTab, setActiveTab] = useState<"liked" | "likeMe" | "matches">(
    "liked"
  );

  return (
    <div className="max-w-3xl mx-auto mt-8">
      {/* --- Tabs menu --- */}
      <div className="flex border-b border-pink-300 text-pink-100">
        <button
          onClick={() => setActiveTab("liked")}
          className={`flex-1 px-4 py-2 transition ${
            activeTab === "liked"
              ? "border-b-2 border-pink-400 text-pink-400 font-semibold"
              : "hover:text-pink-300"
          }`}
        >
          People I like
        </button>
        <button
          onClick={() => setActiveTab("likeMe")}
          className={`flex-1 px-4 py-2 transition ${
            activeTab === "likeMe"
              ? "border-b-2 border-pink-400 text-pink-400 font-semibold"
              : "hover:text-pink-300"
          }`}
        >
          People who likes me
        </button>
        <button
          onClick={() => setActiveTab("matches")}
          className={`flex-1 px-4 py-2 transition ${
            activeTab === "matches"
              ? "border-b-2 border-pink-400 text-pink-400 font-semibold"
              : "hover:text-pink-300"
          }`}
        >
          Matches
        </button>
      </div>

      {/* --- Tabs content --- */}
      <div className="mt-6">
        {activeTab === "liked" && <Liked />}
        {activeTab === "likeMe" && <LikeMe />}
        {activeTab === "matches" && <Matches />}
      </div>
    </div>
  );
}