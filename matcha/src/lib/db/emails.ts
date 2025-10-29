// matcha/src/lib/db/emails.ts
import { executeQuery } from "./db-utils";

export type EmailTokenType = "verify" | "change" | "password_reset";

export interface EmailToken {
  id: string;
  user_id: string;
  token: string;
  type: EmailTokenType;
  new_email?: string | null;
  expires_at: Date;
  created_at: Date;
}

export async function createEmailToken(
  userId: string,
  type: EmailTokenType,
  token: string,
  expiresAt: Date,
  newEmail?: string
): Promise<EmailToken> {
  const query = `
    INSERT INTO email_tokens (user_id, type, token, expires_at, new_email)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const result = await executeQuery<EmailToken>(query, [
    userId,
    type,
    token,
    expiresAt,
    newEmail ?? null,
  ]);
  return result.rows[0];
}

export async function getEmailTokenByToken(token: string): Promise<EmailToken | null> {
  const query = `SELECT * FROM email_tokens WHERE token = $1`;
  const result = await executeQuery<EmailToken>(query, [token]);
  return result.rows[0] || null;
}

export async function listEmailTokensForUser(userId: string): Promise<EmailToken[]> {
  const query = `SELECT * FROM email_tokens WHERE user_id = $1`;
  const result = await executeQuery<EmailToken>(query, [userId]);
  return result.rows;
}

export async function deleteEmailTokenByToken(token: string): Promise<boolean> {
  const query = `DELETE FROM email_tokens WHERE token = $1`;
  const result = await executeQuery(query, [token]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteEmailTokensForUser(userId: string): Promise<boolean> {
  const query = `DELETE FROM email_tokens WHERE user_id = $1`;
  const result = await executeQuery(query, [userId]);
  return (result.rowCount ?? 0) > 0;
}