import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/db/session";
import ProfileTabs from "@/components/profile/ProfileTabs";

async function getCurrentUser() {
	const cookieStore = await cookies();
	const sessionId = cookieStore.get("session_id")?.value;

	if (!sessionId) return null;

	try {
		return await getSessionUser(sessionId);
	} catch (err) {
		console.error("❌ Erreur récupération user depuis session:", err);
		return null;
	}
}

export default async function ProfilePage() {
  // ⚠️ Cette partie dépend de ton système d’authentification
  // Si tu as déjà une session côté serveur, tu peux faire :
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth");
	}

  return (
    <main className="min-h-screen bg-pink-50 flex flex-col items-center py-10">
      {/* Photo principale + onglets */}
      <ProfileTabs user={user} />
    </main>
  );
}