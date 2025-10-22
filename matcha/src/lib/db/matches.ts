// matcha/src/lib/db/match.ts
import { executeQuery } from "@/lib/db/db-utils";
import { PublicUser } from "@/lib/types";
import { addFame } from "./likes";


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

/**
 * Get all users matched with me, excluding blocked users
 * Distance is calculated in km based on latitude/longitude
 */
export async function getMatchesForUser(
  meId: string,
  myLatitude: number,
  myLongitude: number
): Promise<(PublicUser & { distance: number })[]> {
  const query = `
    SELECT uwi.*, ceil(earth_distance(ll_to_earth($1, $2), ll_to_earth(uwi.latitude, uwi.longitude))/1000) AS distance
    FROM matches m
    JOIN users_with_interests uwi 
      ON uwi.id IN (m.user1_id, m.user2_id)
    WHERE m.status = 'match'
      AND $3 IN (m.user1_id, m.user2_id)
      AND uwi.id <> $3
      AND NOT EXISTS (
        SELECT 1
        FROM matches m2
        WHERE (
          (m2.user1_id = $3 AND m2.user2_id = uwi.id)
          OR
          (m2.user1_id = uwi.id AND m2.user2_id = $3)
        )
        AND m2.status = 'block'
      );
  `;
  const result = await executeQuery<PublicUser & { distance: number }>(query, [myLatitude, myLongitude, meId]);
  return result.rows;
}