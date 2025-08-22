import { NextResponse } from 'next/server';
import { loginUser, createSession } from '@/server/routes/login';
import type { User } from "@/types";

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const user:User = await loginUser(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
  }

  const sessionId = await createSession(user.id);
  console.log("session:", sessionId)
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const port = req.headers.get("x-forwarded-port") || "8443";
  console.log("host:", host)
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const res = NextResponse.redirect(new URL("/", `${proto}://${host}:${port}`));
  res.cookies.set('session_id', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
  console.log(res);
  return res;
}
