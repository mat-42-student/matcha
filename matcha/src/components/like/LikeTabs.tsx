// matcha/src/components/like/LikeTabs.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BrowseFromUrl from "@/components/browse/BrowseFromUrl";
import LButton from "./LButton";
import { LikeTabsTypes } from "@/lib/types";

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
  const activeTab: LikeTabsTypes = isLikeTab(tabParam) ? tabParam : "visitors";

  function setActiveTab(tab: LikeTabsTypes) {
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex border-b border-pink-300 text-pink-100">
        <LButton tab="visitors" activeTab={activeTab} setActiveTab={setActiveTab}>Visitors</LButton>
        <LButton tab="liked" activeTab={activeTab} setActiveTab={setActiveTab}>People I like</LButton>
        <LButton tab="likeMe" activeTab={activeTab} setActiveTab={setActiveTab}>People who likes me</LButton>
        <LButton tab="matches" activeTab={activeTab} setActiveTab={setActiveTab}>Matches</LButton>
      </div>

      <div className="p-4">
        {/* key: remount on tab change so filters and pagination start fresh */}
        <BrowseFromUrl key={activeTab} url={TAB_URLS[activeTab]} />
      </div>
    </div>
  );
}
