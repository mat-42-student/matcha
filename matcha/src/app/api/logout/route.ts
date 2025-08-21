// app/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(req: Request) {
  const cookie = req.headers.get('cookie')?.split('session_id=')[1];
  if (cookie) deleteSession(cookie);
  const res = NextResponse.redirect('/');
  res.cookies.set('session_id', '', { maxAge: 0 });
  return res;
}
