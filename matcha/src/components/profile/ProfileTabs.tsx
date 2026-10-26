"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/profile/ProfileForm";
import ProfileGeoloc from "@/components/profile/ProfileGeoloc";
import ProfileInterests from "@/components/profile/ProfileInterests";
import ProfilePictures from "@/components/profile/ProfilePicture";
import ProfileCompletionBar from "./ProfileCompletionBar";
import ProfileMissingElements from "./ProfileMissingElements";
import type { PublicUser } from "@/lib/types";

// my_profile row, with the location fields the geolocation tab can set
type ProfileUser = Omit<PublicUser, "latitude" | "longitude"> & {
  latitude: number | null;
  longitude: number | null;
  country?: string;
};

export default function ProfileTabs({
  user: initialUser,
  completion: initialCompletion,
}: {
  user: ProfileUser;
  completion: {
    percentage: number;
    missingRequired: string[];
    missingOptional: string[];
  };
}) {
  const [user, setUser] = useState(initialUser);
  const [completion, setCompletion] = useState(initialCompletion);

  const refreshCompletion = useCallback(async () => {
    try {
      const res = await fetch("/api/me/completion");
      if (res.ok) setCompletion(await res.json());
    } catch {
      // best effort: the bar keeps its previous value if the request fails
    }
  }, []);

  const handleUserUpdate = useCallback(
    (updates: Partial<ProfileUser>) => {
      setUser((prev) => ({ ...prev, ...updates }));
      refreshCompletion();
    },
    // dependency (do not update handleUserUpdate in componenents unless refreshCompletion changes)
    [refreshCompletion]
  );

  if (!completion) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow-md p-6 text-center">
        Profile loading...
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow-md p-6">
      <div className="mb-6">
        <ProfilePictures userId={user.id} onUpdated={refreshCompletion} />
      </div>

      {/* --- Fame, computed by user_fame (see init-db) --- */}
      <p className="text-sm text-gray-700">
        ⭐ <span className="font-semibold">{user.fame}</span> / 100 fame
        <span className="text-gray-500"> · +5 per link received, +1 per visitor</span>
      </p>

      {/* --- Completion bar --- */}
      <ProfileCompletionBar percentage={completion.percentage} />
      <ProfileMissingElements
        required={completion.missingRequired}
        optional={completion.missingOptional}
      />

      <Tabs defaultValue="info" className="w-full mt-4">
        <TabsList className="flex gap-2 justify-around bg-pink-50 p-2 rounded-full">
          <TabsTrigger value="info">Profil</TabsTrigger>
          <TabsTrigger value="geoloc">Geolocation</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ProfileForm user={user} onUserUpdate={handleUserUpdate}/>
        </TabsContent>

        <TabsContent value="geoloc">
          <ProfileGeoloc
            city={user.city}
            country={user.country}
            latitude={user.latitude}
            longitude={user.longitude}
            onUserUpdate={handleUserUpdate}
          />
        </TabsContent>

        <TabsContent value="interests">
          <ProfileInterests onUserUpdate={handleUserUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}