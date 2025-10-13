// matcha/src/app/page.tsx

import Browse from "@/components/browse/Browse";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { redirect } from "next/navigation";
import { PublicUser } from "@/types";
import { pool } from "@/lib/db/db-utils";
import { analyzeProfileCompletion } from "@/lib/profileCompletion";
import ProfileIncompleteModal from "@/components/profile/ProfileIncompleteModal";

export default async function Homepage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  
  if (!sessionId) redirect("/auth");
  
  const me = await getSessionUser(sessionId);
  if (!me) redirect("/auth");
  
  const completion = await analyzeProfileCompletion(me);

  if (completion.missingRequired.length > 0) {
    // Affiche la modale avec les infos manquantes
    return <ProfileIncompleteModal missing={completion.missingRequired} />;
  }

  try {
    let query = `
    SELECT uwi.*, ceil(earth_distance(ll_to_earth($1, $2), ll_to_earth(uwi.latitude, uwi.longitude))/1000) AS distance
    FROM users_with_interests uwi
    WHERE uwi.id != $3
    AND (uwi.sex_pref = 'B' OR uwi.sex_pref = $4)
    `;

    const params: any[] = [
    me.latitude?.toString() ?? "0",
    me.longitude?.toString() ?? "0",
    me.id,
    me.gender,
    ];

    if (me.sex_pref !== "B") {
    query += " AND uwi.gender = $5";
    params.push(me.sex_pref);
    }

    console.log("QUERY:", query);
    console.log("PARAMS:", params);

    const res = await pool.query(query, params);
    const users: PublicUser[] = res.rows;

    return <Browse users={users} />;

  } catch (err) {

    console.error("Error:", err);
    return <div>Erreur serveur</div>;

  }
}
