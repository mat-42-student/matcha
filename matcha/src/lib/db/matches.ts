// matcha/src/lib/db/match.ts
import { PoolClient } from "pg";
import { executeQuery, pool } from "@/lib/db/db-utils";
import { PublicUser } from "@/lib/types";
import { addFame } from "@/lib/db/db-utils";


export async function blockUser(currentUserId: string, targetUserId: string, client?: PoolClient): Promise<boolean> {
  try {
    // Insert or update the match status
    const update = `
      UPDATE matches
      SET status = 'block'
      WHERE (user1_id = $1 AND user2_id = $2)
        OR (user1_id = $2 AND user2_id = $1)
    `;
    const res = await executeQuery(update, [currentUserId, targetUserId], client);

    if ((res.rowCount ?? 0) === 0) {
      await executeQuery(
        `INSERT INTO matches (user1_id, user2_id, status)
        VALUES ($1, $2, 'block')`,
        [currentUserId, targetUserId],
        client
      );
    }

    // Decrease fame score
    await addFame(-5, targetUserId, client);

    return (res.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error blocking user:", error);
    throw new Error("Database error while blocking user");
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

    const target = await executeQuery(
      `SELECT 1 FROM users WHERE id = $1 FOR UPDATE`,
      [reportedId],
      client
    );
    if (target.rowCount === 0) {
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
      await blockUser(reporterId, reportedId, client);
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