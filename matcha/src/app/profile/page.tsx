import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserByIdFromSession } from "@/lib/db/session";
import ProfileTabs from "@/components/profile/ProfileTabs";

async function getCurrentUser() {
	const cookieStore = await cookies();
	const sessionId = cookieStore.get("session_id")?.value;

	if (!sessionId) return null;

	try {
		return await getUserByIdFromSession(sessionId);
	} catch (err) {
		console.error("❌ Erreur récupération user depuis session:", err);
		return null;
	}
}

export default async function ProfilePage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth");
	}

	return (
		<main className="flex flex-col items-center p-6">
			<h1 className="text-2xl font-bold mb-4">Mon profil</h1>
			<ProfileTabs user={user} editable />
		</main>
	);
}