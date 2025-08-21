import { NextResponse } from 'next/server';
import { loginUser, createSession } from '@/server/routes/login';

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const user = await loginUser(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
  }

  const sessionId = await createSession(user.id);

  const res = NextResponse.redirect('/'); // page d'accueil après login
  res.cookies.set('session_id', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

  return res;
}
