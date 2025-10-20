import { executeQuery } from "./db-utils";
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

/**
 * get all pictures from a user exept main.
 * @param userId - user's ID
 */
export async function getAllPicturesButMain(userId: string) {
  const query = `
    SELECT id, mime_type, encode(data, 'base64') AS data
    FROM pictures
    WHERE user_id = $1 AND NOT is_main;
  `;
  const result = await executeQuery(query, [userId]);
  return result.rows;
}



/**
 * Set the main picture for a user.
 * This will unset the current main picture and set the provided one as main.
 * @param userId - The ID of the user.
 * @param pictureId - The ID of the picture to set as main.
 */
export async function setMainPicture(userId: string, pictureId: string): Promise<void> {
  // Unset all current main pictures
  await executeQuery(`UPDATE pictures SET is_main = false WHERE user_id = $1`, [userId]);

  // Set the new main picture
  await executeQuery(`UPDATE pictures SET is_main = true WHERE id = $1 AND user_id = $2`, [
    pictureId,
    userId,
  ]);
}


/**
 * Deletes a picture belonging to a user.
 * If the deleted picture was the main one, automatically sets another as main if available.
 * @param userId - The ID of the user
 * @param pictureId - The ID of the picture to delete
 */
export async function deleteUserPicture(userId: string, pictureId: string): Promise<void> {
  // Check if picture exists and whether it's the main one
  const checkResult = await executeQuery(
    `SELECT is_main FROM pictures WHERE id = $1 AND user_id = $2`,
    [pictureId, userId]
  );

  const isMain = checkResult.rows[0]?.is_main;

  // Delete the picture
  await executeQuery(`DELETE FROM pictures WHERE id = $1 AND user_id = $2`, [pictureId, userId]);

  // If it was the main picture, set another one as main
  if (isMain) {
    const otherPictures = await executeQuery(
      `SELECT id FROM pictures WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    const newMainId = otherPictures.rows[0]?.id;
    if (newMainId) {
      await executeQuery(`UPDATE pictures SET is_main = TRUE WHERE id = $1`, [newMainId]);
    }
  }
}

/**
 * Retrieves the main profile picture for a given user.
 * @param userId - The user's ID.
 * @returns The main picture (mime_type and data) or null if none exists.
 */
export async function getMainPicture(userId: string) {
  const query = `
    SELECT mime_type, encode(data, 'base64') AS data
    FROM pictures
    WHERE user_id = $1 AND is_main = TRUE;
  `;
  const result = await executeQuery(query, [userId]);
  return result.rows[0] || null;
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