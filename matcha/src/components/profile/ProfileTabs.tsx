"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/profile/ProfileForm";
import ProfileGeoloc from "@/components/profile/ProfileGeoloc";
import ProfileInterests from "@/components/profile/ProfileInterests";
import ProfilePictures from "@/components/profile/ProfilePicture";
import { analyzeProfileCompletion } from "@/lib/profileCompletion";
import ProfileCompletionBar from "./ProfileCompletionBar";
import ProfileMissingElements from "./ProfileMissingElements";

export default function ProfileTabs({ user }: { user: any }) {

      const { completion, missingRequired, missingOptional } = analyzeProfileCompletion(user);

  return (


    <div className="w-full max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow-md p-6">

    
      <div className="mb-6">
        <ProfilePictures userId={user.id} />
      </div>

      <ProfileCompletionBar percentage={completion} />
      <ProfileMissingElements
        required={missingRequired}
        optional={missingOptional}
      />


      <Tabs defaultValue="info" className="w-full mt-4 ">

        <TabsList className="flex gap-2 justify-around bg-pink-50 p-2 rounded-full">
          <TabsTrigger value="info">Profil</TabsTrigger>
          <TabsTrigger value="geoloc">Geolocation</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ProfileForm user={user} />
        </TabsContent>

        <TabsContent value="geoloc">
          <ProfileGeoloc
            city={user.city}
            country={user.country}
            latitude={user.latitude}
            longitude={user.longitude}
          />
        </TabsContent>

        <TabsContent value="interests">
          <ProfileInterests user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}