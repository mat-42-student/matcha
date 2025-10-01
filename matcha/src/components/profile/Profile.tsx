// app/profile/page.tsx
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/forms/ProfileForm";


export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  const user = sessionId ? await getSessionUser(sessionId) : null;

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
      <ProfileForm user={user} />
    </div>
  );
}