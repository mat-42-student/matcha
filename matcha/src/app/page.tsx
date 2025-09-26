import Browse from "@/components/browse/Browse";
import Geoloc from "@/components/geoloc/Geoloc";
import { cookies } from "next/headers";
import { getUserByIdFromSession } from "@/lib/db/session";
import { redirect } from "next/navigation";

export default async function Homepage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  const user = sessionId ? await getUserByIdFromSession(sessionId) : null;

  if (!user) {
    redirect("/auth");
  }

  return (
    <>
      <Browse />
      {/* <Geoloc /> */}
    </>
  );
}
