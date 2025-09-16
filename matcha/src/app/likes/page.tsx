// matcha/src/app/likes/page.tsx
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserByIdFromSession } from "@/lib/db/session";
import { pool } from "@/lib/db/db-utils";
import { useRouter } from "next/navigation";
import { PublicUser } from "@/types";

export default async function Homepage() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || "";
    const router = useRouter();

    const user = await getUserByIdFromSession(sessionId);
    if (!user) {
        router.push("/auth");
        return;
    }
    const query = `
      SELECT user2_id, status
      FROM matches
      WHERE user1_id = $1`
    const res = await pool.query(query, [user.id])
    if (res.rows.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }
  // Recuperer les donnees des users de match

  const users:PublicUser = []

    return (
      <>
        Ici les likes
        {users.rows.map((u) => (
          <CardUser key={u.username} user={u} />
        ))}
      </>
    )

  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}