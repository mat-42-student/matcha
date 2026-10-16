// matcha/src/lib/db/blocks.ts
import { PoolClient } from "pg";
import { executeQuery, pool } from "@/lib/db/db-utils";
import { addFame } from "@/lib/db/db-utils";
import { lockUserPair } from "@/lib/db/users";
import { deleteAllNotificationsBetweenUsers } from "@/lib/db/notifications";
import { BlockedUser } from "@/lib/types";

/**
 * Block inside the caller's transaction, with the pair already locked (lockUserPair).
 * Likes in both directions are removed: no more match, so no more chat.
 * Notifications exchanged by the pair are removed too.
 * Returns false if the target was already blocked by currentUserId.
 */
async function insertBlock(client: PoolClient, currentUserId: string, targetUserId: string): Promise<boolean> {
  const inserted = await executeQuery(
    `INSERT INTO blocks (blocker_id, blocked_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [currentUserId, targetUserId],
    client
  );
  if (inserted.rowCount === 0) return false;

  await executeQuery(
    `DELETE FROM likes
     WHERE (liker_id = $1 AND liked_id = $2)
        OR (liker_id = $2 AND liked_id = $1)`,
    [currentUserId, targetUserId],
    client
  );

  // The relation is over: drop the "liked you" / "viewed your profile"... left in both bells
  await deleteAllNotificationsBetweenUsers(currentUserId, targetUserId, client);

  // Decrease fame score
  await addFame(-5, targetUserId, client);
  return true;
}

/**
 * Block a user. Returns false if the target does not exist or was already blocked.
 */
export async function blockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  if (currentUserId === targetUserId) return false;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const users = await lockUserPair(client, currentUserId, targetUserId);
    const blocked = users.length === 2 && await insertBlock(client, currentUserId, targetUserId);

    await client.query("COMMIT");
    return blocked;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error blocking user:", error);
    throw new Error("Database error while blocking user");
  } finally {
    client.release();
  }
}

/**
 * Remove my block on targetUserId (a block from the other side is kept).
 * Likes removed by the block are not restored. The fame lost at block time is given back,
 * otherwise blocking / unblocking in a loop would drain the target's fame.
 * Returns false if I did not block targetUserId.
 */
export async function unblockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await lockUserPair(client, currentUserId, targetUserId);
    const deleted = await executeQuery(
      `DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [currentUserId, targetUserId],
      client
    );
    const unblocked = deleted.rowCount === 1;
    if (unblocked) await addFame(5, targetUserId, client);

    await client.query("COMMIT");
    return unblocked;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error unblocking user:", error);
    throw new Error("Database error while unblocking user");
  } finally {
    client.release();
  }
}

/**
 * Users blocked by userId, most recent first
 */
export async function getBlockedUsers(userId: string): Promise<BlockedUser[]> {
  const query = `
    SELECT u.id, u.username, u.first_name, b.created_at AS blocked_at
    FROM blocks b
    JOIN users u ON u.id = b.blocked_id
    WHERE b.blocker_id = $1
    ORDER BY b.created_at DESC;
  `;
  const result = await executeQuery<BlockedUser>(query, [userId]);
  return result.rows;
}

/**
 * Report a user as a fake account, then block them.
 * The counter only grows on a first report from this reporter.
 * Returns false if the target does not exist.
 */
export async function reportUser(reporterId: string, reportedId: string): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const users = await lockUserPair(client, reporterId, reportedId);
    if (users.length < 2) {
      await client.query("ROLLBACK");
      return false;
    }

    const inserted = await executeQuery(
      `INSERT INTO reports (reporter_id, reported_id)
       VALUES ($1, $2)
       ON CONFLICT (reporter_id, reported_id) DO NOTHING`,
      [reporterId, reportedId],
      client
    );

    if (inserted.rowCount === 1) {
      await executeQuery(
        `UPDATE users SET report_count = report_count + 1 WHERE id = $1`,
        [reportedId],
        client
      );
    }
    // Always: a user unblocked after a report is blocked again (no-op if still blocked)
    await insertBlock(client, reporterId, reportedId);

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error reporting user:", error);
    throw new Error("Database error while reporting user");
  } finally {
    client.release();
  }
}
