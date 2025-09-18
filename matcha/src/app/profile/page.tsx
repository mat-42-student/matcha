import { Profile } from  "@/components/profile/Profile"
import { EditProfile } from  "@/components/profile/EditProfile"
import { cookies } from "next/headers";
import { getUserByIdFromSession } from "@/lib/db/session";
import { redirect } from "next/navigation";

export default async  function Page() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  const user = sessionId ? await getUserByIdFromSession(sessionId) : null;

  if (!user) {
    redirect("/auth");
  }

    return(
        <>
            <EditProfile />
        </>
    )
}