// matcha/src/lib/db/likes.ts
import { executeQuery } from "./db-utils";
import { LikeStatus, PublicUser } from "@/lib/types";
import { createNotification, deleteNotificationsBetweenUsers } from "./notifications";
import { pool, addFame } from "./db-utils";
import { lockUserPair } from "./users";

/**
 * Get the like/match status between two users, seen from userA
 */
export async function getMatchStatus(userA: string, userB: string): Promise<LikeStatus> {
  const result = await executeQuery<{ status: LikeStatus }>(
    `SELECT like_status($1, $2) AS status`,
    [userA, userB]
  );
  return result.rows[0].status;
}

/**
 * Like a user (creates a match if reciprocated)
 * Like, notifications and fame are written in a single transaction.
 * Returns the new status, or null if nothing changed (self, unknown user, already liked, blocked).
 */
export async function likeUser(meId: string, targetId: string): Promise<"like" | "match" | null> {
  if (meId === targetId) return null; // cannot like self

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Without the lock, two simultaneous likes would both miss the reciprocal one: no match
    const users = await lockUserPair(client, meId, targetId);
    let inserted = 0;
    if (users.length === 2) {
      const res = await executeQuery(
        `INSERT INTO likes (liker_id, liked_id)
         SELECT $1::uuid, $2::uuid
         WHERE NOT is_blocked($1, $2)
         ON CONFLICT DO NOTHING`,
        [meId, targetId],
        client
      );
      inserted = res.rowCount ?? 0;
    }
    if (inserted === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const reciprocal = await executeQuery(
      `SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = $2`,
      [targetId, meId],
      client
    );
    const result = reciprocal.rowCount === 1 ? "match" : "like";

    const nameOf = (id: string) => users.find((u) => u.id === id)?.username || "Someone";

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
 * Remove my like towards targetId. On a match, both likes are removed:
 * the relation is broken and has to be rebuilt from scratch.
 * Returns the removed status, or null if I did not like targetId.
 * Only an unmatch notifies the target; a simple unlike just withdraws the "like" notification.
 */
export async function unlikeUser(meId: string, targetId: string): Promise<"like" | "match" | null> {
  const client = await pool.connect();
  let removed: "like" | "match" | null = null;

  try {
    await client.query("BEGIN");

    await lockUserPair(client, meId, targetId);
    const mine = await executeQuery(
      `DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2`,
      [meId, targetId],
      client
    );
    if (mine.rowCount === 1) {
      const theirs = await executeQuery(
        `DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2`,
        [targetId, meId],
        client
      );
      removed = theirs.rowCount === 1 ? "match" : "like";
    }

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

export async function getMatchesForUser(meId: string): Promise<PublicUser[]> {
  const query = `
    SELECT uwi.*
    FROM user_matches m
    JOIN users_with_interests uwi ON uwi.id = m.matched_id
    WHERE m.user_id = $1;
  `;
  const result = await executeQuery<PublicUser>(query, [meId]);
  return result.rows;
}
