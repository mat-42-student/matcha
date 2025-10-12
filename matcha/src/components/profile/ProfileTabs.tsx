"use client";

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/profile/ProfileForm";
import ProfileGeoloc from "@/components/profile/ProfileGeoloc";
import ProfileInterests from "@/components/profile/ProfileInterests";
import ProfilePictures from "@/components/profile/ProfilePicture";
import ProfileCompletionBar from "./ProfileCompletionBar";
import ProfileMissingElements from "./ProfileMissingElements";


export default function ProfileTabs({
  user: initialUser,
  completion: initialCompletion,
}: {
  user: any;
  completion: {
    percentage: number;
    missingRequired: string[];
    missingOptional: string[];
  };
}) {
  const [user, setUser] = useState(initialUser);
  const [completion, setCompletion] = useState(initialCompletion);

  const refreshCompletion = useCallback(async () => {
    const res = await fetch("/api/me/completion");
    if (res.ok) {
      const data = await res.json();
      setCompletion(data);
    }
  }, []);

  const handleUserUpdate = useCallback(
    (updates: Partial<typeof user>) => {
      setUser((prev : typeof user) => ({ ...prev, ...updates }));
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

      {/* --- Completion bar --- */}
      <ProfileCompletionBar percentage={completion.percentage} />
      <ProfileMissingElements
        required={completion.missingRequired}
        optional={completion.missingOptional}
      />

      {/* --- Onglets --- */}
      <Tabs defaultValue="info" className="w-full mt-4">
        <TabsList className="flex gap-2 justify-around bg-pink-50 p-2 rounded-full">
          <TabsTrigger value="info">Profil</TabsTrigger>
          <TabsTrigger value="geoloc">Géolocalisation</TabsTrigger>
          <TabsTrigger value="interests">Intérêts</TabsTrigger>
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
          <ProfileInterests user={user} onUserUpdate={handleUserUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}