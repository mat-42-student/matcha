// matcha/src/app/likes/page.tsx
"use client";

import { useState } from "react";
import Liked from "@/components/like/Liked";
import LikeMe from "@/components/like/LikeMe";
// import Matches from "@/components/like/Matches";
import Visitors from "@/components/like/Visitors";
import LButton from "./LButton";
import { LikeTabsTypes } from "@/types";

export default function LikeTabs() {
  const [activeTab, setActiveTab] = useState<LikeTabsTypes>(
    "visitors"
  );

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex border-b border-pink-300 text-pink-100">
        <LButton tab="visitors" activeTab={activeTab} setActiveTab={setActiveTab}>Visitors</LButton>
        <LButton tab="liked" activeTab={activeTab} setActiveTab={setActiveTab}>People I like</LButton>
        <LButton tab="likeMe" activeTab={activeTab} setActiveTab={setActiveTab}>People who likes me</LButton>
        {/* <LButton tab="matches" activeTab={activeTab} setActiveTab={setActiveTab}>Matches</LButton> */}

      </div>

      <div>
        {activeTab === "visitors" && <Visitors />}
        {activeTab === "liked" && <Liked />}
        {activeTab === "likeMe" && <LikeMe />}
        {/* {activeTab === "matches" && <Matches />} */}
      </div>
    </div>
  );
}