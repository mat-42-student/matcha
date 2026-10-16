// matcha/src/components/like/LikeTabs.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Ban } from "lucide-react";
import BrowseFromUrl from "@/components/browse/BrowseFromUrl";
import BlockedUsers from "./BlockedUsers";
import LButton from "./LButton";
import { LikeTabsTypes } from "@/lib/types";

const BLOCKED_TAB = "blocked";

const TAB_URLS: Record<LikeTabsTypes, string> = {
  visitors: "/api/match/getViews",
  liked: "/api/match/getLikes",
  likeMe: "/api/match/getLikeMe",
  matches: "/api/match/getMatches",
};

function isLikeTab(tab: string | null): tab is LikeTabsTypes {
  return tab !== null && Object.hasOwn(TAB_URLS, tab);
}

export default function LikeTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The active tab lives in the url (?tab=...) so notification links can open a given tab
  const tabParam = searchParams.get("tab");
  // Blocked users: secondary tab, out of the main tab bar
  const showBlocked = tabParam === BLOCKED_TAB;
  const activeTab: LikeTabsTypes | null = showBlocked ? null : isLikeTab(tabParam) ? tabParam : "visitors";

  function setActiveTab(tab: LikeTabsTypes | typeof BLOCKED_TAB) {
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex border-b border-pink-300 text-pink-100">
        <LButton tab="visitors" activeTab={activeTab} setActiveTab={setActiveTab}>Visitors</LButton>
        <LButton tab="liked" activeTab={activeTab} setActiveTab={setActiveTab}>People I like</LButton>
        <LButton tab="likeMe" activeTab={activeTab} setActiveTab={setActiveTab}>People who likes me</LButton>
        <LButton tab="matches" activeTab={activeTab} setActiveTab={setActiveTab}>Matches</LButton>
        {/* Secondary tab: same row, but narrower and greyed out */}
        <button
          onClick={() => setActiveTab(BLOCKED_TAB)}
          title="Blocked users"
          aria-label="Blocked users"
          className={`shrink-0 flex items-center gap-1 px-3 py-2 text-xs transition ${
            showBlocked
              ? "border-b-2 border-pink-400 text-pink-400 font-semibold"
              : "text-gray-400 hover:text-pink-300"
          }`}
        >
          <Ban size={12} />
          <span className="hidden sm:inline">Blocked</span>
        </button>
      </div>

      <div className="p-4">
        {/* key: remount on tab change so filters and pagination start fresh */}
        {activeTab ? <BrowseFromUrl key={activeTab} url={TAB_URLS[activeTab]} /> : <BlockedUsers />}
      </div>
    </div>
  );
}
