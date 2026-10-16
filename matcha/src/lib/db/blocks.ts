// matcha/src/lib/db/blocks.ts
import { PoolClient } from "pg";
import { executeQuery, pool } from "@/lib/db/db-utils";
import { addFame } from "@/lib/db/db-utils";
import { lockUserPair } from "@/lib/db/users";

/**
 * Block inside the caller's transaction, with the pair already locked (lockUserPair).
 * Likes in both directions are removed: no more match, so no more chat.
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
      await insertBlock(client, reporterId, reportedId);
    }

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
