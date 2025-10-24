// matcha/src/lib/db/likes.ts
import { executeQuery } from "./db-utils";
import { PublicUser } from "@/lib/types";
import { createNotification } from "./notifications";
import { pool } from "./db-utils";
import { PoolClient } from "pg";



/**
 * Add or subtract fame for a user
 * Fame will always be between 0 and 100
 * @param delta - positive or negative number
 * @param userId - id of the user
 */
export async function addFame(delta: number, userId: string, client?: PoolClient) {
  const query = `
    UPDATE users
    SET fame = GREATEST(fame + $1, 0)
    WHERE id = $2
  `;
  await executeQuery(query, [delta, userId], client);
}

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
 * Handles transactions, fame increment, and notifications
 */
export async function likeUser(meId: string, targetId: string) {
  if (meId === targetId) return; // cannot like self

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if target already liked me
    const existing = await executeQuery<{ status: string }>(
      `SELECT status FROM matches WHERE user1_id = $1 AND user2_id = $2`,
      [targetId, meId],
      client
    );

    // Fetch sender info once
    const senderRes = await executeQuery<{ first_name: string }>(
      `SELECT first_name FROM users WHERE id = $1`,
      [meId],
      client
    );
    const senderName = senderRes.rows[0]?.first_name || "Someone";

    if (existing.rows.length > 0 && existing.rows[0].status === "like") {
      // Reciprocated like → match
      await executeQuery(
        `UPDATE matches SET status = 'match' WHERE user1_id = $1 AND user2_id = $2`,
        [targetId, meId],
        client
      );

      await Promise.all([
        createNotification(targetId, meId, "match", `You matched with ${senderName}!`, client),
        createNotification(meId, targetId, "match", `You matched with ${await getUserName(targetId)}!`, client),
      ]);
    } else {
      await executeQuery(
        `INSERT INTO matches (user1_id, user2_id, status)
         VALUES ($1, $2, 'like')`,
        [meId, targetId],
        client
      );

      await createNotification(targetId, meId, "like", `${senderName} liked you`, client);
    }

    await addFame(5, targetId, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Helper to fetch a user's first name
 */
async function getUserName(userId: string): Promise<string> {
  const res = await executeQuery<{ first_name: string }>(
    `SELECT first_name FROM users WHERE id = $1`,
    [userId]
  );
  return res.rows[0]?.first_name || "Someone";
}


/**
 * fame issue 
 */
export async function unlikeUser(meId: string, targetId: string) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Supprime le match ou le like entre les deux utilisateurs
    const query = `
      DELETE FROM matches
      WHERE (user1_id = $1 AND user2_id = $2)
         OR (user1_id = $2 AND user2_id = $1)
    `;
    const result = await executeQuery(query, [meId, targetId], client);

    // Crée la notification de "unlike"
    await createNotification(targetId, meId, "unlike", "Someone unliked you", client);

    // Diminue la "fame" du user qui s’est fait unliker
    await addFame(-5, targetId, client);

    await client.query("COMMIT");

    return result.rowCount ?? 0;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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