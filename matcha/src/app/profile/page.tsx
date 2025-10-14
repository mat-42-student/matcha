import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/db/session";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { analyzeProfileCompletion } from "@/lib/profileCompletion";

async function getCurrentUser() {
	const cookieStore = await cookies();
	const sessionId = cookieStore.get("session_id")?.value;

	if (!sessionId) return null;

	try {
		return await getSessionUser(sessionId);
	} catch (err) {
		console.error("❌ Could not get user from session:", err);
		return null;
	}
}


export default async function ProfilePage() {

	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth");
	}

    const completionData = await analyzeProfileCompletion(user);

  return (
    <main className="min-h-screen bg-pink-50 flex flex-col items-center py-10">
      <ProfileTabs user={user} completion={completionData}/>
    </main>
  );
}