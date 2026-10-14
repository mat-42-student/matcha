// matcha/src/app/api/me/password/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { changeUserPassword } from "@/lib/db/users";
import { validatePassword } from "@/lib/validators/serverValidator";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const { current_password, new_password } = await req.json();
    if (!current_password || !new_password) {
      return NextResponse.json({ error: "missing field" }, { status: 400 });
    }


    const passwordErrors = validatePassword(new_password);
    if (passwordErrors.length > 0) {
      return NextResponse.json({ field: "new_password", errors: passwordErrors }, { status: 400 });
    }

    const success = await changeUserPassword(user.id, current_password, new_password);
    if (!success) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur changement mot de passe :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}