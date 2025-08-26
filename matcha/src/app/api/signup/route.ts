// src/app/api/signup/route.ts
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { users } from '@/lib/db';

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const email = formData.get('email') as string;
	const password = formData.get('password') as string;

	if (!email || !password) {
		return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
	}

	const existingUser = users.find(u => u.email === email);
	if (existingUser) {
		return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 400 });
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const newUser = { id: String(users.length + 1), email, passwordHash };
	users.push(newUser);

	// Redirection basée sur l’URL réellement appelée par le client
	const url = req.nextUrl.clone();
	url.pathname = '/auth';
	url.search = '';

	console.log('Redirecting to:', url.toString());
	return NextResponse.redirect(url, 303); // 303 = convertit en GET
}