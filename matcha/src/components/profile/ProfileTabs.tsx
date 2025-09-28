// matcha/src/app/likes/page.tsx
"use client";

import { useState } from "react";
import Profile from "@/components/profile/Profile";
import EditProfile from "@/components/profile/EditProfile"
import { PublicUser } from "@/types";

export default function ProfileTabs({user}:{user: PublicUser}) {
  const [activeTab, setActiveTab] = useState<"profile" | "editProfile">(
    "profile"
  );

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex border-b border-pink-300 text-pink-100">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 px-4 py-2 transition ${
            activeTab === "profile"
              ? "border-b-2 border-pink-400 text-pink-400 font-semibold"
              : "hover:text-pink-300"
          }`}
        >
          My profile
        </button>
        <button
          onClick={() => setActiveTab("editProfile")}
          className={`flex-1 px-4 py-2 transition ${
            activeTab === "editProfile"
              ? "border-b-2 border-pink-400 text-pink-400 font-semibold"
              : "hover:text-pink-300"
          }`}
        >
          Edit profile
        </button>
      </div>

      <div className="flex justify-center m-4">
        {activeTab === "profile" && <Profile user={ user } />}
        {activeTab === "editProfile" && <EditProfile user={ user } />}
      </div>
    </div>
  );
}