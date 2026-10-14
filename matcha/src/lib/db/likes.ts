// matcha/src/lib/db/likes.ts
import { executeQuery } from "./db-utils";
import { PublicUser } from "@/lib/types";
import { createNotification, deleteNotificationsBetweenUsers } from "./notifications";
import { pool, addFame } from "./db-utils";

/**
 * Get the like/match status between two users
 */
export async function getMatchStatus(userA: string, userB: string): Promise<'match' | 'like' | 'isLiked' | 'block' | 'none'> {
  const query = `
    SELECT CASE
      WHEN EXISTS (
        SELECT 1 FROM matches 
        WHERE ((user1_id = $1 AND user2_id = $2)
          OR  (user1_id = $2 AND user2_id = $1))
          AND status = 'match'
      )
      THEN 'match'

      WHEN EXISTS (
        SELECT 1 FROM matches 
        WHERE ((user1_id = $1 AND user2_id = $2)
          OR  (user1_id = $2 AND user2_id = $1))
          AND status = 'block'
      )
      THEN 'block'

      WHEN EXISTS (
        SELECT 1 FROM matches 
        WHERE user1_id = $1 AND user2_id = $2 AND status = 'like'
      )
      THEN 'like'

      WHEN EXISTS (
        SELECT 1 FROM matches 
        WHERE user1_id = $2 AND user2_id = $1 AND status = 'like'
      )
      THEN 'isLiked'

      ELSE 'none'
    END AS status;
  `;
  const result = await executeQuery(query, [userA, userB]);
  return result.rows[0]?.status;
}

/**
 * Like a user (creates a match if reciprocated)
 * Relation row, notifications and fame are written in a single transaction.
 * Returns the new status, or null if nothing changed (self, already liked/matched, blocked).
 */
export async function likeUser(meId: string, targetId: string): Promise<"like" | "match" | null> {
  if (meId === targetId) return null; // cannot like self

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let result: "like" | "match" | null = null;
    // Two attempts: if a concurrent request inserted the pair row first, read it again
    for (let attempt = 0; attempt < 2 && !result; attempt++) {
      // Lock the pair row (one row per pair, enforced by matches_pair_idx)
      const existing = await executeQuery<{ user1_id: string; status: string }>(
        `SELECT user1_id, status FROM matches
         WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
         FOR UPDATE`,
        [meId, targetId],
        client
      );
      const row = existing.rows[0];

      if (row) {
        // Only a like from the target can change: already liked by me, matched or blocked → no-op
        if (row.status !== "like" || row.user1_id !== targetId) break;
        await executeQuery(
          `UPDATE matches SET status = 'match' WHERE user1_id = $1 AND user2_id = $2`,
          [targetId, meId],
          client
        );
        result = "match";
      } else {
        const inserted = await executeQuery(
          `INSERT INTO matches (user1_id, user2_id, status)
           VALUES ($1, $2, 'like')
           ON CONFLICT DO NOTHING`,
          [meId, targetId],
          client
        );
        if ((inserted.rowCount ?? 0) > 0) result = "like";
      }
    }

    if (!result) {
      await client.query("ROLLBACK");
      return null;
    }

    const names = await executeQuery<{ id: string; username: string }>(
      `SELECT id, username FROM users WHERE id = ANY($1::uuid[])`,
      [[meId, targetId]],
      client
    );
    const nameOf = (id: string) => names.rows.find((u) => u.id === id)?.username || "Someone";

    if (result === "match") {
      await createNotification(targetId, meId, "match", `You matched with ${nameOf(meId)}!`, client);
      await createNotification(meId, targetId, "match", `You matched with ${nameOf(targetId)}!`, client);
    } else {
      await createNotification(targetId, meId, "like", `${nameOf(meId)} liked you`, client);
    }
    await addFame(5, targetId, client);

    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


/**
 * Remove my like (or our match) towards targetId.
 * Blocks are left untouched. Returns the removed status, or null if there was nothing to unlike.
 * Only an unmatch notifies the target; a simple unlike just withdraws the "like" notification.
 */
export async function unlikeUser(meId: string, targetId: string): Promise<"like" | "match" | null> {
  const client = await pool.connect();
  let removed: "like" | "match" | null = null;

  try {
    await client.query("BEGIN");

    // Supprime mon like ou notre match (jamais un block)
    const query = `
      DELETE FROM matches
      WHERE (user1_id = $1 AND user2_id = $2 AND status = 'like')
         OR (((user1_id = $1 AND user2_id = $2)
           OR (user1_id = $2 AND user2_id = $1)) AND status = 'match')
      RETURNING status
    `;
    const res = await executeQuery<{ status: "like" | "match" }>(query, [meId, targetId], client);
    removed = res.rows[0]?.status ?? null;

    if (removed === "match") {
      await createNotification(targetId, meId, "unlike", "Someone unliked you", client);
    } else if (removed === "like") {
      await deleteNotificationsBetweenUsers(targetId, meId, ["like"], client);
    }
    // Diminue la "fame" du user qui s'est fait unliker
    if (removed) await addFame(-5, targetId, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return removed;
}

export async function getUsersWhoLikedMe(meId: string): Promise<PublicUser[]> {
  const query = `
    SELECT u.*
    FROM users_who_like_me u
    WHERE u.me = $1
  `;
  const result = await executeQuery<PublicUser>(query, [meId]);
  return result.rows;
}

export async function getUsersILike(meId: string): Promise<PublicUser[]> {
  const query = `
    SELECT u.*
    FROM users_me_like u
    WHERE u.me = $1
  `;
  const result = await executeQuery<PublicUser>(query, [meId]);
  return result.rows;
}