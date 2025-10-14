// matcha/src/app/page.tsx

import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { redirect } from "next/navigation";
import { analyzeProfileCompletion } from "@/lib/profileCompletion";
import ProfileIncompleteModal from "@/components/profile/ProfileIncompleteModal";
import MainContent from "@/components/browse/MainContent";

export default async function Homepage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) redirect("/auth");
  
  const me = await getSessionUser(sessionId);
  if (!me) redirect("/auth");
  
  const completion = await analyzeProfileCompletion(me);

  if (completion.missingRequired.length > 0) {
    return <ProfileIncompleteModal missing={completion.missingRequired} />;
  }

  return <MainContent />;
}
