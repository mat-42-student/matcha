import { SignupForm } from "@/components/forms/SignupForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserByIdFromSession } from "@/lib/db/session";

export default async function SignupPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    const user = await getUserByIdFromSession(sessionId);
    if (user) {
      redirect("/"); // déjà connecté → redirigé
    }
  }


  return (
    <div className="w-full h-full flex items-center justify-center ">
      <SignupForm />
    </div>
  );
}