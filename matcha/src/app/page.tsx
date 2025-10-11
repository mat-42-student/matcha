// matcha/src/app/page.tsx

import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { redirect } from "next/navigation";
import MainContent from "@/components/browse/MainContent";

export default async function Homepage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) redirect("/auth");
  
  const me = await getSessionUser(sessionId);
  if (!me) redirect("/auth");
  
  return <MainContent />;
}
