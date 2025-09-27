// matcha/src/app/page.tsx

import Browse from "@/components/browse/Browse";
import { cookies } from "next/headers";
import { getUserByIdFromSession } from "@/lib/db/session";
import { redirect } from "next/navigation";
import { PublicUser } from "@/types";
import { pool } from "@/lib/db/db-utils";

export default async function Homepage() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) redirect("/auth");

    const me = await getUserByIdFromSession(sessionId);
    if (!me) redirect("/auth");

    let query = `
      SELECT *
      FROM users_with_interests uwi
      WHERE uwi.id != $1
        AND (uwi.sex_pref = 'B' OR uwi.sex_pref = $2)
    `;

    const params: any[] = [me.id, me.gender];
    if (me.sex_pref !== "B") {
      query += " AND uwi.gender = $3";
      params.push(me.sex_pref);
    }
    const res = await pool.query(query, params);
    const users: PublicUser[] = res.rows;

    return <Browse users={users} />;
  } catch (err) {
    console.error("Error:", err);
    return <div>Erreur serveur</div>;
  }
}
