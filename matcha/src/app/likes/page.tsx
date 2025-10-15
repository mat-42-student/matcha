// matcha/src/app/likes/page.tsx

import { redirect } from "next/navigation";
import LikeTabs from "@/components/like/LikeTabs";
import { checkSessionAndCompletion } from "@/lib/profileCompletion";
import ProfileIncompleteModal from "@/components/profile/ProfileIncompleteModal";

export default async function LikesPage() {
  const { user, completion } = await checkSessionAndCompletion();
  if (!user)
    redirect("/auth"); 
  if (completion?.missingRequired.length > 0)
    return <ProfileIncompleteModal missing={completion.missingRequired} />;

  return <LikeTabs />;
}

