// matcha/src/lib/db/pictures.ts

import { executeQuery, pool } from "./db-utils";
import { PoolClient, QueryResultRow } from "pg";

export const MAX_PICTURES = 5;

/**
 * Serializes picture writes of a user (upload / delete / set main) by locking
 * their users row until the end of the transaction, so concurrent requests
 * cannot leave the user with two main pictures, none, or more than MAX_PICTURES.
 */
async function lockUserPictures(client: PoolClient, userId: string) {
  await executeQuery(`SELECT 1 FROM users WHERE id = $1 FOR UPDATE`, [userId], client);
}

/**
 * Get all picture from a user.
 * @param userId - user's ID
 */
export async function getPictures(userId: string) {
  const query = `
    SELECT id, is_main
    FROM pictures
    WHERE user_id = $1;
  `;

  const result = await executeQuery(query, [userId]);
  return result.rows;
}

// Hides pictures of $1 from viewer $2 when either user blocked the other
const NO_BLOCK_BETWEEN = `
  NOT EXISTS (
    SELECT 1 FROM matches
    WHERE ((user1_id = $1 AND user2_id = $2)
        OR (user1_id = $2 AND user2_id = $1))
      AND status = 'block'
  )
`;

/**
 * get all pictures from a user exept main, as seen by another user.
 * Returns nothing if either user blocked the other.
 * @param userId - user's ID
 * @param viewerId - ID of the user requesting the pictures
 */
export async function getAllPicturesButMain(userId: string, viewerId: string) {
  const query = `
    SELECT id
    FROM pictures
    WHERE user_id = $1 AND NOT is_main
      AND ${NO_BLOCK_BETWEEN}
    ORDER BY id;
  `;
  const result = await executeQuery(query, [userId, viewerId]);
  return result.rows;
}

/**
 * Main picture of a user as seen by another user.
 * Returns null if there is none or if either user blocked the other.
 */
export async function getVisibleMainPicture(userId: string, viewerId: string) {
  const query = `
    SELECT id
    FROM pictures
    WHERE user_id = $1 AND is_main = TRUE
      AND ${NO_BLOCK_BETWEEN}
    LIMIT 1;
  `;
  const result = await executeQuery(query, [userId, viewerId]);
  return result.rows[0] || null;
}

/**
 * Binary content of a picture, as seen by a user: their own pictures, or
 * someone else's when neither user blocked the other. Null otherwise.
 */
export async function getVisiblePictureData(pictureId: string, viewerId: string) {
  const query = `
    SELECT p.mime_type, p.data
    FROM pictures p
    WHERE p.id = $1
      AND (p.user_id = $2 OR NOT EXISTS (
        SELECT 1 FROM matches
        WHERE ((user1_id = p.user_id AND user2_id = $2)
            OR (user1_id = $2 AND user2_id = p.user_id))
          AND status = 'block'
      ));
  `;
  const result = await executeQuery<{ mime_type: string | null; data: Buffer | null }>(
    query,
    [pictureId, viewerId]
  );
  return result.rows[0] || null;
}

/**
 * Set the main picture for a user.
 * This will unset the current main picture and set the provided one as main.
 * @param userId - The ID of the user.
 * @param pictureId - The ID of the picture to set as main.
 * @returns false if the picture does not belong to the user (nothing changed).
 */
export async function setMainPicture(userId: string, pictureId: string): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await lockUserPictures(client, userId);

    const owned = await executeQuery(
      `SELECT 1 FROM pictures WHERE id = $1 AND user_id = $2`,
      [pictureId, userId],
      client
    );
    if ((owned.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    // two statements: the unique index on is_main forbids two main pictures at once
    await executeQuery(
      `UPDATE pictures SET is_main = false WHERE user_id = $1 AND is_main`,
      [userId],
      client
    );
    await executeQuery(
      `UPDATE pictures SET is_main = true WHERE id = $1 AND user_id = $2`,
      [pictureId, userId],
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


/**
 * Deletes a picture belonging to a user.
 * If the deleted picture was the main one, automatically sets another as main if available.
 * @param userId - The ID of the user
 * @param pictureId - The ID of the picture to delete
 * @returns false if the picture does not belong to the user (nothing deleted).
 */
export async function deleteUserPicture(userId: string, pictureId: string): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await lockUserPictures(client, userId);

    const deleted =await executeQuery<{ is_main: boolean }>(
      `DELETE FROM pictures WHERE id = $1 AND user_id = $2 RETURNING is_main`,
      [pictureId, userId],
      client
    );
    if ((deleted.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    // If it was the main picture, promote the oldest remaining one
    if (deleted.rows[0].is_main) {
      await executeQuery(
        `UPDATE pictures SET is_main = true
         WHERE id = (SELECT id FROM pictures WHERE user_id = $1 ORDER BY id LIMIT 1)`,
        [userId],
        client
      );
    }

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Retrieves the main profile picture for a given user.
 * @param userId - The user's ID.
 * @returns The main picture id or null if none exists.
 */
export async function getMainPicture(userId: string) {
  const query = `
    SELECT id
    FROM pictures
    WHERE user_id = $1 AND is_main = TRUE
    LIMIT 1;
  `;
  const result = await executeQuery(query, [userId]);
  return result.rows[0] || null;
}


/**
 * Check whether a user has a main (profile) picture, without loading its data.
 */
export async function hasMainPicture(userId: string): Promise<boolean> {
  const result = await executeQuery(
    `SELECT 1 FROM pictures WHERE user_id = $1 AND is_main = TRUE LIMIT 1`,
    [userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getUserPictures(userId: string) {
  const query = `
    SELECT id, is_main
    FROM pictures
    WHERE user_id = $1
    ORDER BY id;
  `;
  const result = await executeQuery<QueryResultRow>(query, [userId]);
  return result.rows;
}


export async function addUserPicture(
  userId: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<QueryResultRow | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await lockUserPictures(client, userId);

    const count = await executeQuery<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM pictures WHERE user_id = $1`,
      [userId],
      client
    );
    if (count.rows[0].count >= MAX_PICTURES) {
      await client.query("ROLLBACK");
      return null;
    }

    // The first picture (or the first one after the main was removed) becomes main
    const inserted = await executeQuery<QueryResultRow>(
      `INSERT INTO pictures (user_id, data, mime_type, is_main)
       VALUES ($1, $2, $3,
         NOT EXISTS (SELECT 1 FROM pictures WHERE user_id = $1 AND is_main))
       RETURNING id, is_main`,
      [userId, fileBuffer, mimeType],
      client
    );

    await client.query("COMMIT");
    return inserted.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


export async function countUserPictures(userId: string): Promise<number> {
  const query = `SELECT COUNT(*)::int AS count FROM pictures WHERE user_id = $1;`;
  const result = await executeQuery<QueryResultRow>(query, [userId]);
  return result.rows[0]?.count ?? 0;
}