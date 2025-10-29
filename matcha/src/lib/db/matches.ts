// matcha/src/lib/db/match.ts
import { executeQuery } from "@/lib/db/db-utils";
import { PublicUser } from "@/lib/types";
import { addFame } from "@/lib/db/db-utils";


export async function blockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    // Insert or update the match status
    const update = `
      UPDATE matches
      SET status = 'block'
      WHERE (user1_id = $1 AND user2_id = $2)
        OR (user1_id = $2 AND user2_id = $1)
    `;
    const res = await executeQuery(update, [currentUserId, targetUserId]);

    if ((res.rowCount ?? 0) === 0) {
      await executeQuery(
        `INSERT INTO matches (user1_id, user2_id, status)
        VALUES ($1, $2, 'block')`,
        [currentUserId, targetUserId]
      );
    }

    // Decrease fame score
    await addFame(-5, targetUserId);

    return (res.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error blocking user:", error);
    throw new Error("Database error while blocking user");
  }
}

export async function getMatchesForUser(meId: string,): Promise<PublicUser[]> {
  const query = `
    SELECT uwi.*
    FROM matches m
    JOIN users_with_interests uwi 
      ON uwi.id IN (m.user1_id, m.user2_id)
    WHERE m.status = 'match'
      AND $1 IN (m.user1_id, m.user2_id)
      AND uwi.id <> $1;
  `;
  const result = await executeQuery<PublicUser>(query,[meId]);
  return result.rows;
}