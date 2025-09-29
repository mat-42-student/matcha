import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '@/lib/db/users';
import { createEmailVerification } from '@/lib/db/emailVerifications';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getGPSFromCityName } from '@/lib/gps'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;
    const birthdate = formData.get('birthdate') as string;
    const gender = formData.get('gender') as string;
    const sex_pref = formData.get('sex_pref') as string;
    const city = formData.get('city') as string;

    if (!email || !password || !username || !gender || !birthdate || !sex_pref || !city) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 📍 Get GPS loc from city
    const coords = await getGPSFromCityName(city);
    if (!coords) {
      return NextResponse.json({ error: "Unable to resolve gps coords of target city"}, { status: 400 });
    }

    // 📝 Création en DB
    const newUser = await createUser({
      username,
      email,
      passwd: passwordHash,
      country: 'France',
      city,
      gender,
      sex_pref,
      bio: '',
      fame: 0,
      latitude: coords.lat,
      longitude: coords.lon,
      birthdate: birthdate,
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

    await createEmailVerification(newUser.id, token, expiresAt);

    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${token}`;

    // ⚡ Nodemailer pour Mailpit
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,       // "localhost" ou "mailpit" selon docker
      port: parseInt(process.env.SMTP_PORT || "1025"),
      secure: false,                     // Mailpit ne nécessite pas TLS
      // Pas besoin d'auth si Mailpit est en mode par défaut
    });

    const info = await transporter.sendMail({
      from: `"Matcha" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Vérifie ton email",
      html: `
        <h1>Bienvenue sur Matcha 🎉</h1>
        <p>Pour activer ton compte, clique ici :</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `,
    });
    console.log("Mail envoyé :", info);


    return NextResponse.json({ success: true, message: 'Utilisateur créé, email de vérification envoyé' });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}