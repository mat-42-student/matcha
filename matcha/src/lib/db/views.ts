// matcha/src/lib/db/views.ts
import { executeQuery } from "@/lib/db/db-utils";
import { PublicUser } from "@/lib/types";
import { createNotification } from "@/lib/db/notifications";

const VIEW_RENOTIFY_DELAY = "1 minute";

/**
 * Record a user profile view.
 * - Inserts or updates a record in the "views" table.
 * - A new view notifies the viewed user; their fame counts distinct visitors, the latest visits weighing more (see fame_weight).
 * - A visit from the same viewer notifies again once VIEW_RENOTIFY_DELAY has passed
 *   (the notification may have been deleted or read meanwhile), replacing the previous one.
 * - Nothing is recorded (nor notified) if either user blocked the other.
 * - scored: a new line was created; notified: the viewed user got a notification
 *   (not when they unliked the viewer)
 */
export async function recordProfileView(
  viewedUserId: string,
  viewerUserId: string
): Promise<{ scored: boolean; notified: boolean }> {
  // Insert or update the view, unless the user does not exist or a block exists between both users.
  // "previous" reads the snapshot taken before the statement: the last visit before this one.
  const insertQuery = `
    WITH previous AS (
      SELECT created_at FROM views WHERE user_id = $1 AND seen_by = $2
    )
    INSERT INTO views (user_id, seen_by)
    SELECT id, $2::uuid FROM users
    WHERE id = $1 AND NOT is_blocked($1, $2)
    ON CONFLICT (user_id, seen_by)
    DO UPDATE SET created_at = CURRENT_TIMESTAMP
    RETURNING (xmax = 0) AS inserted,
      COALESCE((SELECT created_at FROM previous) < now() - $3::interval, true) AS notify;
  `;

  const result = await executeQuery<{ inserted: boolean; notify: boolean }>(
    insertQuery,
    [viewedUserId, viewerUserId, VIEW_RENOTIFY_DELAY]
  );
  const row = result.rows[0];
  if (!row) return { scored: false, notified: false };

  if (row.notify) {
    const viewerNameResult = await executeQuery<{ username: string }>(
      `SELECT username FROM users WHERE id = $1`,
      [viewerUserId]
    );
    const viewerName = viewerNameResult.rows[0]?.username || "Someone";
    const notified = await createNotification(viewedUserId, viewerUserId, "view", `${viewerName} viewed your profile`);
    return { scored: row.inserted, notified };
  }
  return { scored: row.inserted, notified: false };
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
/**
 * Get all users I viewed, excluding blocked users
 */
export async function getViewedByUser(meId: string): Promise<PublicUser[]> {
  const query = `
    SELECT u.*, distance_km($1, u.id) AS distance, like_status($1, u.id) AS "likeStatus"
    FROM views v
    JOIN users_with_interests u ON u.id = v.user_id
    WHERE v.seen_by = $1
      AND NOT is_blocked($1, u.id)
    ORDER BY v.created_at DESC;
  `;
  const result = await executeQuery<PublicUser>(query, [meId]);
  return result.rows;
}
