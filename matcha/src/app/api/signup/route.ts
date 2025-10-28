// matcha/src/app/api/signup/route.ts

import { validateSignupData } from '@/lib/validators/serverValidator';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, isEmailUsed } from '@/lib/db/users';
import { createEmailVerification } from '@/lib/db/emails';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const birthdate = formData.get('birthdate') as string;

    const { valid, errors } = validateSignupData({
      email,
      password,
      first_name,
      last_name,
      birthdate,
    });

    console.log("errors");

    if (!valid) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const existingUser = await isEmailUsed(email);
    if (existingUser) {
      return NextResponse.json({ errors: { email: 'Email is already used' } }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      first_name,
      last_name,
      email,
      passwd: passwordHash,
      bio: '',
      birthdate: birthdate,
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

    await createEmailVerification(newUser.id, token, expiresAt);

    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/e-mail/verify?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "1025"),
      secure: false,
    });

    await transporter.sendMail({
      from: `"Matcha" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Verify your email",
      html: `
        <h1>Welcome to Matcha 🎉</h1>
        <p>Click here to verify your account:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}