// matcha/src/lib/db/views.ts
import { executeQuery } from "@/lib/db/db-utils";
import { PublicUser } from "@/lib/types";
import { addFame } from "@/lib/db/db-utils";

/**
 * Record a user profile view.
 * - Inserts or updates a record in the "views" table.
 * - If it's a new view (not an update), increases the viewed user's fame by 1.
 * - Return true if a new line was created
 */
export async function recordProfileView(viewedUserId: string, viewerUserId: string): Promise<boolean> {
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
    return true
  }
  return false
}

/**
 * Get all users who viewed me, excluding blocked users
 * Distance is calculated in km based on latitude/longitude
 */
export async function getViewsForUser(meId: string,): Promise<PublicUser[]> {
  const query = `
    SELECT u.*
    FROM views v
    JOIN users_with_interests u ON u.id = v.seen_by
    WHERE v.user_id = $1
      AND NOT EXISTS (
        SELECT 1
        FROM matches m
        WHERE (
          (m.user1_id = $1 AND m.user2_id = u.id)
          OR
          (m.user1_id = u.id AND m.user2_id = $1)
        )
        AND m.status = 'block'
      )
    ORDER BY v.created_at DESC;
  `;
  const result = await executeQuery<PublicUser>(query, [meId]);
  return result.rows;
}