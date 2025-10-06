import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/db/session";
import ProfileForm from "@/components/forms/ProfileForm";
import ProfilePicture from "@/components/profile/ProfilePicture";

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
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth");
	}

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">My profile</h1>
            <ProfilePicture userId={user.id} />
      <ProfileForm user={user} />
    </div>
  );
}