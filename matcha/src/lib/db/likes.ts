// matcha/src/lib/db/likes.ts
import { executeQuery } from "./db-utils";
import { PublicUser } from "@/lib/types";



/**
 * Add or subtract fame for a user
 * Fame will always be between 0 and 100
 * @param delta - positive or negative number
 * @param userId - id of the user
 */
export async function addFame(delta: number, userId: string) {
  const query = `
    UPDATE users
    SET fame = LEAST(GREATEST(fame + $1, 0), 100)
    WHERE id = $2
  `;
  await executeQuery(query, [delta, userId]);
}

/**
 * Get the like/match status between two users
 */
export async function getMatchStatus(userA: string, userB: string): Promise<'match' | 'like' | 'isLiked' | 'none'> {
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
  const result = await executeQuery<{ status: 'match' | 'like' | 'isLiked' | 'none' }>(query, [userA, userB]);
  return result.rows[0]?.status ?? 'none';
}

/**
 * Like a user (creates a match if reciprocated)
 * Handles transactions and fame increment
 */
export async function likeUser(meId: string, targetId: string) {
  if (meId === targetId) return; // cannot like self

  // Start transaction
  await executeQuery('BEGIN');

  try {
    // Check if target already liked me
    const existing = await executeQuery(
      `SELECT status FROM matches WHERE user1_id = $1 AND user2_id = $2`,
      [targetId, meId]
    );

    if (existing.rows.length > 0 && existing.rows[0].status === 'like') {
      // Reciprocal like → match
      await executeQuery(
        `UPDATE matches SET status = 'match' WHERE user1_id = $1 AND user2_id = $2`,
        [targetId, meId]
      );
    } else {
      // Normal like
      await executeQuery(
        `INSERT INTO matches (user1_id, user2_id, status)
         VALUES ($1, $2, 'like')
         ON CONFLICT (user1_id, user2_id) DO NOTHING`,
        [meId, targetId]
      );
    }

    // Increase fame
    await addFame(5, targetId);

    // Commit transaction
    await executeQuery('COMMIT');
  } catch (err) {
    await executeQuery('ROLLBACK');
    throw err;
  }
}

export async function unlikeUser(meId: string, targetId: string) {
  // Start transaction
  await executeQuery('BEGIN');

  try {
    const query = `
      DELETE FROM matches
      WHERE (user1_id = $1 AND user2_id = $2)
         OR (user1_id = $2 AND user2_id = $1)
    `;
    const result = await executeQuery(query, [meId, targetId]);

    // Decrease fame
    await addFame(-5, targetId);

    await executeQuery('COMMIT');

    return result.rowCount ?? 0;
  } catch (err) {
    await executeQuery('ROLLBACK');
    throw err;
  }
}

/**
 * Get all users who liked me, excluding blocked users
 * Distance is calculated in km based on latitude/longitude
 */
export async function getUsersWhoLikedMe(
  meId: string,
  myLatitude: number,
  myLongitude: number
): Promise<(PublicUser & { distance: number })[]> {
  const query = `
    SELECT u.*, ceil(earth_distance(ll_to_earth($1, $2), ll_to_earth(latitude, longitude))/1000) AS distance
    FROM users_who_like_me u
    WHERE u.me = $3
      AND NOT EXISTS (
        SELECT 1
        FROM matches m
        WHERE (
          (m.user1_id = $3 AND m.user2_id = u.id)
          OR
          (m.user1_id = u.id AND m.user2_id = $3)
        ) AND m.status = 'block'
      );
  `;
  const result = await executeQuery<PublicUser & { distance: number }>(query, [myLatitude, myLongitude, meId]);
  return result.rows;
}

export async function getUsersILike(
  meId: string,
  myLatitude: number,
  myLongitude: number
): Promise<(PublicUser & { distance: number })[]> {
  const query = `
    SELECT u.*, ceil(earth_distance(ll_to_earth($1, $2), ll_to_earth(u.latitude, u.longitude))/1000) AS distance
    FROM users_me_like u
    WHERE u.me = $3
      AND NOT EXISTS (
        SELECT 1
        FROM matches m
        WHERE (
          (m.user1_id = $3 AND m.user2_id = u.id)
          OR
          (m.user1_id = u.id AND m.user2_id = $3)
        ) AND m.status = 'block'
      );
  `;
  const result = await executeQuery<PublicUser & { distance: number }>(query, [myLatitude, myLongitude, meId]);
  return result.rows;
}