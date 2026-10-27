// matcha/src/lib/db/session.ts
import { v4 as uuidv4 } from "uuid";
import { executeQuery } from "./db-utils";
import type { MyProfile } from "@/lib/types";

export async function createSession(userId: string): Promise<string> {
  const sessionId = uuidv4();

  await executeQuery(`DELETE FROM sessions WHERE expires_at <= NOW()`);

  await executeQuery(
    `INSERT INTO sessions (id, user_id) VALUES ($1, $2)`,
    [sessionId, userId]
  );

  return sessionId;
}

/**
 * Delete a session, returns the id of its user (null if it did not exist)
 */
export async function deleteSession(sessionId: string): Promise<string | null> {
  const result = await executeQuery<{ user_id: string }>(
    `DELETE FROM sessions WHERE id = $1 RETURNING user_id`,
    [sessionId]
  );
  return result.rows[0]?.user_id ?? null;
}

export async function deleteSessionsForUser(userId: string) {
  await executeQuery(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}

/**
 * Delete every session of the user except keepSessionId (password change: the current device stays logged in)
 */
export async function deleteOtherSessionsForUser(userId: string, keepSessionId: string) {
  await executeQuery(`DELETE FROM sessions WHERE user_id = $1 AND id <> $2`, [userId, keepSessionId]);
}

/**
 * Expiry date of a valid session, null if it does not exist or has expired
 */
export async function getSessionExpiry(sessionId: string): Promise<Date | null> {
  const result = await executeQuery<{ expires_at: Date }>(
    `SELECT expires_at FROM sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  return result.rows[0]?.expires_at ?? null;
}

export async function getSessionUser(sessionId: string): Promise<MyProfile | null> {
  if (!sessionId) return null;

  const result = await executeQuery<MyProfile>(
    `SELECT mp.*
     FROM sessions s
     JOIN my_profile mp ON s.user_id = mp.id
     WHERE s.id = $1
       AND s.expires_at > NOW()
     LIMIT 1`,
    [sessionId]
  );

  return result.rows[0] || null;
}