import { pool } from "./db-utils";
import { getUserById } from "./users";

export async function getUserByIdFromSession(sessionId: string) {
  const res = await pool.query(
    "SELECT user_id FROM sessions WHERE id = $1",
    [sessionId]
  );

  if (res.rowCount === 0) return null;

  const userId = res.rows[0].user_id;
  return getUserById(userId);
}