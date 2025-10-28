// matcha/src/lib/db/emailVerifications.ts
import { executeQuery } from "./db-utils";

export interface EmailVerification {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export async function createEmailVerification(user_id: string, token: string, expiresAt: Date): Promise<EmailVerification> {
  const query = `
    INSERT INTO email_verifications (user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await executeQuery<EmailVerification>(query, [user_id, token, expiresAt]);
  return result.rows[0];
}


export async function getEmailVerificationByToken(token: string): Promise<EmailVerification | null> {
  const query = `SELECT * FROM email_verifications WHERE token = $1`;
  const result = await executeQuery<EmailVerification>(query, [token]);
  return result.rows[0] || null;
}

export async function listEmailVerificationsForUser(userId: string): Promise<EmailVerification[]> {
  const query = `SELECT * FROM email_verifications WHERE user_id = $1`;
  const result = await executeQuery<EmailVerification>(query, [userId]);
  return result.rows;
}

export async function deleteEmailVerificationByToken(token: string): Promise<boolean> {
  const query = `DELETE FROM email_verifications WHERE token = $1`;
  const result = await executeQuery(query, [token]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteEmailVerificationsForUser(userId: string): Promise<boolean> {
  const query = `DELETE FROM email_verifications WHERE user_id = $1`;
  const result = await executeQuery(query, [userId]);
  return (result.rowCount ?? 0) > 0;
}

export async function createEmailChangeRequest(userId: string, newEmail: string, token: string, expiresAt: Date) {
  const query = `
    INSERT INTO email_change_requests (user_id, new_email, token, expires_at)
    VALUES ($1, $2, $3, $4)
  `;
  await executeQuery(query, [userId, newEmail, token, expiresAt]);
}

export async function getEmailChangeRequestByToken(token: string) {
  const query = `SELECT * FROM email_change_requests WHERE token = $1`;
  const res = await executeQuery(query, [token]);
  return res.rows[0] || null;
}

export async function deleteEmailChangeRequest(token: string) {
  await executeQuery(`DELETE FROM email_change_requests WHERE token = $1`, [token]);
}