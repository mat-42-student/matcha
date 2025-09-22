import { cookies } from "next/headers";
import { getUserByIdFromSession } from "@/lib/db/session";
import { redirect } from "next/navigation";
import LikeTabs from "@/components/like/LikeTabs";

export default async function LikesPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  const user = sessionId ? await getUserByIdFromSession(sessionId) : null;

  if (!user) {
    redirect("/auth");
  }

  return <LikeTabs />;
}