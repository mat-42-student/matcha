// matcha/src/app/auth/page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/db/session";
import LoginForm from "@/components/forms/LoginForm";

export default async function AuthPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    const user = await getSessionUser(sessionId);
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



