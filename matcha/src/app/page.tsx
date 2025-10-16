// matcha/src/app/page.tsx

import { redirect } from "next/navigation";
import ProfileIncompleteModal from "@/components/profile/ProfileIncompleteModal";
import MainContent from "@/components/browse/MainContent";
import { checkSessionAndCompletion } from "@/lib/profileCompletion";

export default async function Homepage() {
    
  const { user, completion } = await checkSessionAndCompletion();
  if (!user)
    redirect("/auth"); 
  if (completion?.missingRequired.length > 0)
    return <ProfileIncompleteModal missing={completion.missingRequired} />;

  return <MainContent />;
}
