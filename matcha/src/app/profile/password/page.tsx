// matcha\src\app\profile\password\page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/db/session";
import ProfilePasswordChange from "@/components/profile/ProfilePasswordChange";



async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) return null;

  try {
    return await getSessionUser(sessionId);
  } catch (err) {
    console.error("failed getting session user:", err);
    return null;
  }
}


export default async function passwordChangePage() {

  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }


  return (
    <main className="min-h-screen bg-pink-50 flex flex-col items-center py-10">
      <ProfilePasswordChange />
    </main>
  );
}



