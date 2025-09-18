import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserByIdFromSession } from "@/lib/db/session";
import LoginForm from "@/components/forms/LoginForm";

export default async function AuthPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    const user = await getUserByIdFromSession(sessionId);
    if (user) {
      redirect("/");
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <LoginForm />
    </div>
  );
}



