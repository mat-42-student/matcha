// matcha/src/app/api/signup/route.ts

import { validateSignupData } from '@/lib/validators/serverValidator';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, isEmailUsed, isUsernameUsed } from '@/lib/db/users';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => null);
    // missing or non-text fields become "" and are rejected by validateSignupData
    const field = (name: string) => {
      const value = formData?.get(name);
      return typeof value === 'string' ? value : '';
    };
    const username = field('username');
    const email = field('email');
    const password = field('password');
    const first_name = field('first_name');
    const last_name = field('last_name');
    const birthdate = field('birthdate');

    const { valid, errors } = validateSignupData({
      username,
      email,
      password,
      first_name,
      last_name,
      birthdate,
    });

    if (!valid) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    if (await isUsernameUsed(username)) {
      return NextResponse.json({ errors: { username: 'Username is already taken' } }, { status: 400 });
    }

    const existingUser = await isEmailUsed(email);
    if (existingUser) {
      return NextResponse.json({ errors: { email: 'Email is already used' } }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      username,
      first_name,
      last_name,
      email,
      passwd: passwordHash,
      bio: '',
      birthdate: birthdate,
    });

    await sendVerificationEmail(newUser.id, email);

    return NextResponse.json({ success: true });
  } catch (error) {
    // unique violation: username/email taken by a concurrent signup
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Username or email is already used' }, { status: 400 });
    }
    console.error("Signup error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}