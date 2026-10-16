// matcha/src/lib/db/interests.ts

import { executeQuery, pool } from "./db-utils";

export interface Interest {
  id: number;
  name: string;
}

export interface UserInterest {
  user_id: string;
  interest_id: number;
}

/**
 * Fetch all available interests
 */
export async function getAllInterests(): Promise<Interest[]> {
  const query = `
    SELECT id, name
    FROM interests
    ORDER BY name ASC;
  `;
  const result = await executeQuery<Interest>(query);
  return result.rows;
}

/**
 * Fetch all interests of a given user
 */
export async function getUserInterests(userId: string): Promise<Interest[]> {
  if (!userId) throw new Error("Missing userId");

  const query = `
    SELECT i.id, i.name
    FROM user_interests ui
    JOIN interests i ON ui.interest_id = i.id
    WHERE ui.user_id = $1
    ORDER BY i.name ASC;
  `;
  const result = await executeQuery<Interest>(query, [userId]);
  return result.rows;
}

/**
 * Replaces the interests of a user in one transaction. The users row is locked
 * so that concurrent updates (one per click on the profile) are applied one
 * after the other instead of mixing their DELETE / INSERT.
 * @returns false if an id does not exist (nothing is changed).
 */
export async function updateUserInterests(userId: string, interestIds: number[]): Promise<boolean> {
  const ids = [...new Set(interestIds)];
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await executeQuery(`SELECT 1 FROM users WHERE id = $1 FOR NO KEY UPDATE`, [userId], client);

    const existing = await executeQuery(
      `SELECT id FROM interests WHERE id = ANY($1::int[])`,
      [ids],
      client
    );
    if ((existing.rowCount ?? 0) !== ids.length) {
      await client.query("ROLLBACK");
      return false;
    }

    await executeQuery(`DELETE FROM user_interests WHERE user_id = $1`, [userId], client);
    await executeQuery(
      `INSERT INTO user_interests (user_id, interest_id)
       SELECT $1, unnest($2::int[])`,
      [userId, ids],
      client
    );

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
