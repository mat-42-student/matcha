import { pool } from "./db-utils";
import { v4 as uuidv4 } from "uuid";
import type { PublicUser } from "@/types";

export async function createSession(userId: string): Promise<string> {
	const sessionId = uuidv4();

	await pool.query(
		`INSERT INTO sessions (id, user_id) VALUES ($1, $2)`,
		[sessionId, userId]
	);

	return sessionId;
}

export async function deleteSession(sessionId: string) {
  await pool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}

export async function getUserByIdFromSession(sessionId: string): Promise<PublicUser | null> {
    if (!sessionId) return null;

    const result = await pool.query(
        `SELECT uwi.*
        FROM sessions s
        JOIN users_with_interests uwi ON s.user_id = uwi.id
        WHERE s.id = $1 AND s.expires_at > NOW()
        LIMIT 1`,
        [sessionId]
    );

    return result.rows[0] || null;
    }