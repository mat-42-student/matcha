// matcha/src/app/likes/page.tsx
"use client";

import { useState } from "react";
import Liked from "@/components/like/Liked";
import LikeMe from "@/components/like/LikeMe";
import Matches from "@/components/like/Matches";
import Visitors from "@/components/like/Visitors";

export default function LikeTabs() {
  const [activeTab, setActiveTab] = useState<"visitors" | "liked" | "likeMe" | "matches">(
    "visitors"
  );

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex border-b border-pink-300 text-pink-100">
        <button
          onClick={() => setActiveTab("visitors")}
          className={`flex-1 px-4 py-2 transition ${
            activeTab === "visitors"
              ? "border-b-2 border-pink-400 text-pink-400 font-semibold"
              : "hover:text-pink-300"
          }`}
        >
          Visitors
        </button>

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

      <div>
        {activeTab === "visitors" && <Visitors />}
        {activeTab === "liked" && <Liked />}
        {activeTab === "likeMe" && <LikeMe />}
        {activeTab === "matches" && <Matches />}
      </div>
    </div>
  );
}