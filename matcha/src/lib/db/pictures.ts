// matcha/src/lib/db/pictures.ts

import { executeQuery, pool } from "./db-utils";
import { QueryResultRow } from "pg";

/**
 * Add a new picture for a user.
 * @param userId - user's ID
 * @param data - picture binary datas
 * @param mimeType - MIME typre
 * @param isMain - define if the picture is the main one
 */
export async function addPicture(
  userId: string,
  data: Buffer,
  mimeType: string,
  isMain = false
) {
  const query = `
    INSERT INTO pictures (user_id, data, mime_type, is_main)
    VALUES ($1, $2, $3, $4)
    RETURNING id, mime_type, encode(data, 'base64') as data, is_main;
  `;

  const result = await executeQuery(query, [userId, data, mimeType, isMain]);
  return result.rows[0];
}

/**
 * Get all picture from a user.
 * @param userId - user's ID
 */
export async function getPictures(userId: string) {
  const query = `
    SELECT id, mime_type, encode(data, 'base64') as data, is_main
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
    SELECT id, mime_type, encode(data, 'base64') AS data
    FROM pictures
    WHERE user_id = $1 AND NOT is_main
      AND ${NO_BLOCK_BETWEEN};
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
    SELECT id, mime_type, encode(data, 'base64') AS data
    FROM pictures
    WHERE user_id = $1 AND is_main = TRUE
      AND ${NO_BLOCK_BETWEEN}
    LIMIT 1;
  `;
  const result = await executeQuery(query, [userId, viewerId]);
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

    const owned = await executeQuery(
      `SELECT 1 FROM pictures WHERE id = $1 AND user_id = $2 FOR UPDATE`,
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

    const deleted = await executeQuery<{ is_main: boolean }>(
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
 * @returns The main picture (mime_type and data) or null if none exists.
 */
export async function getMainPicture(userId: string) {
  const query = `
    SELECT id, mime_type, encode(data, 'base64') AS data
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
    SELECT id, mime_type, encode(data, 'base64') AS data, is_main
    FROM pictures
    WHERE user_id = $1;
  `;
  const result = await executeQuery<QueryResultRow>(query, [userId]);
  return result.rows;
}


export async function addUserPicture(
  userId: string,
  fileBuffer: Buffer,
  mimeType: string
) {
  // Check if the user already has a main picture
  const existingMainQuery = `
    SELECT id FROM pictures
    WHERE user_id = $1 AND is_main = TRUE;
  `;
  const existingMain = await executeQuery<QueryResultRow>(existingMainQuery, [userId]);
  const isMain = existingMain.rows.length === 0;

  // Insert the new picture
  const insertQuery = `
    INSERT INTO pictures (user_id, data, mime_type, is_main)
    VALUES ($1, $2, $3, $4)
    RETURNING id, mime_type, encode(data, 'base64') AS data, is_main;
  `;
  const inserted = await executeQuery<QueryResultRow>(insertQuery, [
    userId,
    fileBuffer,
    mimeType,
    isMain,
  ]);

  return inserted.rows[0];
}


export async function countUserPictures(userId: string): Promise<number> {
  const query = `SELECT COUNT(*)::int AS count FROM pictures WHERE user_id = $1;`;
  const result = await executeQuery<QueryResultRow>(query, [userId]);
  return result.rows[0]?.count ?? 0;
}