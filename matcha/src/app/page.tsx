// matcha/src/app/page.tsx

import Browse from "@/components/browse/Browse";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { redirect } from "next/navigation";
import { PublicUser } from "@/types";
import { pool } from "@/lib/db/db-utils";

export default async function Homepage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  
  if (!sessionId) redirect("/auth");
  
  const me = await getSessionUser(sessionId);
  if (!me) redirect("/auth");
  
  try {
    const query = "SELECT * FROM compatible_users_from($1);";
    const params = [me.id];
    const res = await pool.query(query, params);
    const users: PublicUser[] = res.rows;

    return <Browse users={users} />;
  } catch (err) {
    console.error("Error:", err);
    return <div>Erreur serveur</div>;
  }
}
