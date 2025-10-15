// matcha/src/app/chat/page.tsx

import { redirect } from "next/navigation";
import Chat from "@/components/MainComponents/Chat";
import { checkSessionAndCompletion } from "@/lib/profileCompletion";
import ProfileIncompleteModal from "@/components/profile/ProfileIncompleteModal";

export default async function SearchPage() {
  const { user, completion } = await checkSessionAndCompletion();
  if (!user)
    redirect("/auth"); 
  if (completion?.missingRequired.length > 0)
    return <ProfileIncompleteModal missing={completion.missingRequired} />;

  return (
    <Chat />
  );
}
