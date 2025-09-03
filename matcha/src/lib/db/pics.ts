import { pool } from '../db-utils';

export async function getMainPicUrlByUserId( userId : string ) {
  console.log("getMainPicUrlByUserId userId: ", userId);
  const result = await pool.query(
    `SELECT url, id
     FROM pictures
     WHERE user_id = $1;`,
    [userId]
  );
  console.log("getMainPicUrlByUserId result: ", result.rows);
  return result.rows[0];
}