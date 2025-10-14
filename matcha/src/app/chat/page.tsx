// matcha/src/app/chat/page.tsx

import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { redirect } from "next/navigation";
import Chat from "@/components/MainComponents/Chat";

export default async function SearchPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  const user = sessionId ? await getSessionUser(sessionId) : null;

  if (!user) {
    redirect("/auth");
  }

  return (
    <Chat />
  );
}
