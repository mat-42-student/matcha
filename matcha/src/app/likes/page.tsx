// matcha/src/app/likes/page.tsx
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserByIdFromSession } from "@/lib/db/session";
import { pool } from "@/lib/db/db-utils";
// import { useRouter } from "next/navigation";
import { PublicUser } from "@/types";
import CardUser from "@/components/card-user/CardUser";

export default async function Homepage() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || "";

    const user = await getUserByIdFromSession(sessionId);
    if (!user) {
      return <>Go auth</>;
    }
    const { rows: likes } = await pool.query(
      `SELECT user2_id FROM matches WHERE user1_id = $1`,
      [user.id]
    );
    if (likes.length === 0) {
      return (<div>I'm sorry no one liked you</div>);
    }
    const { rows: users } = await pool.query(
      `SELECT id, username, bio, city, gender, date_part('year', age(current_date, birthdate))::int AS age
      FROM users
      WHERE id = ANY($1)`,
      [likes.map((l) => l.user2_id)]
    );

    return (
    <div className="h-full overflow-auto p-4">
      <div className="flex flex-wrap justify-center">
        {users.map((u) => (
          <CardUser key={u.username} user={u} />
        ))}
      </div>
    </div>
    )

  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}