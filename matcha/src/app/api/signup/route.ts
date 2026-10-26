// matcha/src/app/api/signup/route.ts

import { normalizeEmail, validateSignupData } from '@/lib/validators/serverValidator';
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
    const email = normalizeEmail(field('email'));
    const password = field('password');
    // validated and stored trimmed
    const first_name = field('first_name').trim();
    const last_name = field('last_name').trim();
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

    // the account exists either way: on failure, logging in sends a new link
    const emailSent = await sendVerificationEmail(newUser.id, email)
      .then(() => true)
      .catch((err) => {
        console.error("Error verification email:", err);
        return false;
      });

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    // unique violation: username/email taken by a concurrent signup
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Username or email is already used' }, { status: 400 });
    }
    console.error("Signup error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}