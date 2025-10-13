import { SignupForm } from "@/components/forms/SignupForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/db/session";

export default async function SignupPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    const user = await getSessionUser(sessionId);
    if (user) {
      redirect("/");
    }
  }


  return (
    <div className="w-full h-full flex items-center justify-center ">
      <SignupForm />
    </div>
  );
}