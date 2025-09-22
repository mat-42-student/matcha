import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '@/lib/db/users';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string; // 👈 tu peux ajouter ça dans ton formulaire
    const birthdate = formData.get('birthdate') as string;
    const gender = formData.get('gender') as string;     // 👈 obligatoire d’après ton schéma
    const sex_pref = formData.get('sex_pref') as string; // 👈 obligatoire aussi
    const city = formData.get('city') as string;         // 👈 requis par la DB

    // ✅ Vérification des champs requis
    if (!email || !password || !username || !gender || !birthdate || !sex_pref || !city) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    // 🔍 Vérifier si l’utilisateur existe déjà
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 400 });
    }

    // 🔐 Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // 📝 Création en DB
    const newUser = await createUser({
      username,
      email,
      passwd: passwordHash,
      country: 'France', // tu peux adapter si tu veux le récupérer du form
      city,
      gender,
      sex_pref,
      bio: '',
      fame: 0,
      latitude: 0,
      longitude: 0,
      birthdate: birthdate,
    });

    console.log("Nouvel utilisateur enregistré en DB :", newUser);

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}