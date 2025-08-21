// lib/auth.ts
import { sessions, users } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { cookies } from "next/headers";

export async function loginUser(email: string, password: string) {
  const user = users.find(u => u.email === email);  if (!user) return null;
  const match = await bcrypt.compare(password, user.passwordHash);
  return match ? user : null;
}

export async function createSession(userId: string) {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000*60*60*24);
  sessions.push({ id, userId, expiresAt });
  return id;
}

export async function getSessionUser(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) return null;
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.expiresAt < new Date()) return null;
  return users.find(u => u.id === session.userId) || null;
}

export function deleteSession(sessionId: string) {
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index >= 0) sessions.splice(index, 1);
}
