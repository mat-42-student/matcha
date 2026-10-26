// matcha/src/lib/db/views.ts
import { executeQuery } from "@/lib/db/db-utils";
import { PublicUser } from "@/lib/types";
import { createNotification } from "@/lib/db/notifications";

/**
 * Record a user profile view.
 * - Inserts or updates a record in the "views" table.
 * - A new view (not an update) notifies the viewed user; their fame counts distinct visitors.
 * - Nothing is recorded (nor notified) if either user blocked the other.
 * - Return true if a new line was created
 */
export async function recordProfileView(viewedUserId: string, viewerUserId: string): Promise<boolean> {
  // Insert or update the view, unless the user does not exist or a block exists between both users
  const insertQuery = `
    INSERT INTO views (user_id, seen_by)
    SELECT id, $2::uuid FROM users
    WHERE id = $1 AND NOT is_blocked($1, $2)
    ON CONFLICT (user_id, seen_by)
    DO UPDATE SET created_at = CURRENT_TIMESTAMP
    RETURNING (xmax = 0) AS inserted;
  `;

  const result = await executeQuery<{ inserted: boolean }>(insertQuery, [viewedUserId, viewerUserId]);

  if (result.rows[0]?.inserted) {
    const viewerNameResult = await executeQuery<{ username: string }>(
      `SELECT username FROM users WHERE id = $1`,
      [viewerUserId]
    );
    const viewerName = viewerNameResult.rows[0]?.username || "Someone";
    await createNotification(viewedUserId, viewerUserId, "view", `${viewerName} viewed your profile`);
    return true
  }
  return false
}

/**
 * Get all users who viewed me, excluding blocked users
 */
export async function getViewsForUser(meId: string,): Promise<PublicUser[]> {
  const query = `
    SELECT u.*, distance_km($1, u.id) AS distance, like_status($1, u.id) AS "likeStatus"
    FROM views v
    JOIN users_with_interests u ON u.id = v.seen_by
    WHERE v.user_id = $1
      AND NOT is_blocked($1, u.id)
    ORDER BY v.created_at DESC;
  `;
  const result = await executeQuery<PublicUser>(query, [meId]);
  return result.rows;
}