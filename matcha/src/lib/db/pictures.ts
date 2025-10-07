import { pool } from "./db-utils";


export async function addPicture(userId: string, data: Buffer, mimeType: string, isMain = false) {
  const query = `
    INSERT INTO pictures (user_id, data, mime_type, is_main)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, data, mimeType, isMain]);
  return result.rows[0];
}

export async function getPictures(userId: string) {
  const query = `
    SELECT id, mime_type, encode(data, 'base64') as data, is_main
    FROM pictures
    WHERE user_id = $1;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function setMainPicture(userId: string, picId: string) {
  await pool.query(`UPDATE pictures SET is_main = false WHERE user_id = $1`, [userId]);
  await pool.query(`UPDATE pictures SET is_main = true WHERE user_id = $1 AND id = $2`, [
    userId,
    picId,
  ]);
}