// matcha/src/lib/db/views.ts
import { executeQuery } from "@/lib/db/db-utils";
import { PublicUser } from "@/types";
import { addFame } from "./likes";

/**
 * Record a user profile view.
 * - Inserts or updates a record in the "views" table.
 * - If it's a new view (not an update), increases the viewed user's fame by 1.
 */
export async function recordProfileView(viewedUserId: string, viewerUserId: string): Promise<void> {
  // Insert or update the view
  const insertQuery = `
    INSERT INTO views (user_id, seen_by)
    VALUES ($1, $2)
    ON CONFLICT (user_id, seen_by)
    DO UPDATE SET created_at = CURRENT_TIMESTAMP
    RETURNING (xmax = 0) AS inserted;
  `;

  const result = await executeQuery<{ inserted: boolean }>(insertQuery, [viewedUserId, viewerUserId]);

  // Increase fame only if this was a new view
  if (result.rows[0]?.inserted) {
    await addFame(1, viewedUserId);
  }
}

/**
 * Get all users who viewed me, excluding blocked users
 * Distance is calculated in km based on latitude/longitude
 */
export async function getViewsForUser(
  meId: string,
  myLatitude: number,
  myLongitude: number
): Promise<(PublicUser & { distance: number })[]> {
  const query = `
    SELECT u.*, ceil(earth_distance(ll_to_earth($1, $2), ll_to_earth(u.latitude, u.longitude))/1000) AS distance
    FROM views v
    JOIN users_with_interests u ON u.id = v.seen_by
    WHERE v.user_id = $3
      AND NOT EXISTS (
        SELECT 1
        FROM matches m
        WHERE (
          (m.user1_id = $3 AND m.user2_id = u.id)
          OR
          (m.user1_id = u.id AND m.user2_id = $3)
        )
        AND m.status = 'block'
      )
    ORDER BY v.created_at DESC;
  `;
  const result = await executeQuery<PublicUser & { distance: number }>(query, [myLatitude, myLongitude, meId]);
  return result.rows;
}

