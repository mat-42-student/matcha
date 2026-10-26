// matcha/src/lib/db/users.ts
import bcrypt from 'bcryptjs';
import { PoolClient } from 'pg';
import { executeQuery } from "./db-utils";

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  passwd: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  birthdate: string;
  gender?: string;
  sex_pref?: string;
  bio?: string;
  is_verified: boolean;
  created_at?: Date;
}

/**
 * Utilitaire pour construire une requête INSERT générique
 */
async function insertUser(user: Partial<User>, allowedFields: (keyof User)[]): Promise<Pick<User, 'id'>> {
  const fields = (Object.keys(user) as (keyof User)[])
    .filter((f) => allowedFields.includes(f));

  const columns = fields.map((f) => `"${f}"`).join(", ");
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
  const values = fields.map((f) => user[f] ?? null);

  // only the id: the row holds the password hash, which must never reach a response
  const query = `INSERT INTO users (${columns}) VALUES (${placeholders}) RETURNING id`;
  const result = await executeQuery<Pick<User, 'id'>>(query, values);
  return result.rows[0];
}

/**
 * Create a new user (email stored in lower case)
 */
export async function createUser(user: Omit<User, 'id' | 'created_at' | 'is_verified'>): Promise<Pick<User, 'id'>> {
  const allowedFields: (keyof User)[] = [
    "username","first_name","last_name","email","passwd","country","city",
    "latitude","longitude","birthdate","gender","sex_pref","bio"
  ];
  return insertUser({ ...user, email: user.email.toLowerCase() }, allowedFields);
}

/**
 * Update a user (partial update), true if the user was updated
 */
export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<boolean> {
  const allowedFields: (keyof User)[] = [
    "username","first_name","last_name","city","country",
    "gender","sex_pref","bio","birthdate","latitude","longitude"
  ];

  const fields = (Object.keys(updates) as (keyof User)[]).filter((f) => allowedFields.includes(f));
  if (fields.length === 0) return false;

  const setClauses = fields.map((f, i) => `"${f}" = $${i + 1}`).join(", ");
  const values = fields.map((f) => updates[f]);

  const query = `UPDATE users SET ${setClauses} WHERE id = $${fields.length + 1}`;
  const result = await executeQuery(query, [...values, id]);

  return (result.rowCount ?? 0) > 0;
}

/**
 * Update user email (only after confirmation through the email change flow)
 */
export async function updateUserEmail(id: string, email: string): Promise<void> {
  await executeQuery('UPDATE users SET email = lower($1) WHERE id = $2', [email, id]);
}

/**
 * Get user by id
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await executeQuery<User>('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

/**
 * Current fame of a user (computed from likes and views, see user_fame), null if unknown
 */
export async function getFame(id: string): Promise<number | null> {
  const result = await executeQuery<{ fame: number | null }>('SELECT user_fame($1) AS fame', [id]);
  return result.rows[0]?.fame ?? null;
}

/**
 * Check if an email is taken (case-insensitive, see users_email_lower_idx)
 */
export async function isEmailUsed(email: string): Promise<boolean> {
  const result = await executeQuery('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email]);
  return result.rows.length > 0;
}

/**
 * Check if a username is taken (case-insensitive), optionally ignoring one user
 */
export async function isUsernameUsed(username: string, excludeId?: string): Promise<boolean> {
  const result = await executeQuery(
    'SELECT 1 FROM users WHERE lower(username) = lower($1) AND id IS DISTINCT FROM $2',
    [username, excludeId ?? null]
  );
  return result.rows.length > 0;
}

// hash compared against when the account does not exist (same cost as signup), computed once
let dummyHash: Promise<string> | null = null;

/**
 * Try to log user
 */
export async function loginUser(identifier: string, password: string): Promise<User | null> {
  // identifier is either an email or a username, both case-insensitive
  const query = identifier.includes('@')
    ? 'SELECT * FROM users WHERE lower(email) = lower($1)'
    : 'SELECT * FROM users WHERE lower(username) = lower($1)';
  const result = await executeQuery<User>(query, [identifier]);
  const user = result.rows[0];
  if (!user) {
    // same bcrypt work as a wrong password: the response time does not tell which accounts exist
    dummyHash ??= bcrypt.hash('matcha-dummy-password', 10);
    await bcrypt.compare(password, await dummyHash);
    return null;
  }

  const match = await bcrypt.compare(password, user.passwd);
  if (!match) return null;

  return user;
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
  const result = await executeQuery('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function markUserAsVerified(userId: string): Promise<boolean> {
  const query = `
    UPDATE users
    SET is_verified = true
    WHERE id = $1
  `;
  const result = await executeQuery(query, [userId]);
  return (result.rowCount ?? 0) > 0;
}


/**
 * Get the total number of users with interests.
 */
export async function getUsersCount(): Promise<number> {
  const query = `SELECT COUNT(id) AS total FROM users_with_interests;`;
  const result = await executeQuery<{ total: string }>(query);
  return parseInt(result.rows[0].total, 10);
}

/**
 * Get user by email (case-insensitive)
 */
export async function getUserByEmail(email: string): Promise<Pick<User, 'id'> | null> {
	const result = await executeQuery<Pick<User, 'id'>>(
		'SELECT id FROM users WHERE lower(email) = lower($1)',
		[email]
	);
	return result.rows[0] ?? null;
}


export async function updateUserPassword(id: string, hashedPassword: string): Promise<boolean> {
	const query = `
    UPDATE users
    SET passwd = $1
    WHERE id = $2
  `;
	const result = await executeQuery(query, [hashedPassword, id]);
	return (result.rowCount ?? 0) > 0;
}

export async function changeUserPassword (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const result = await executeQuery<User>(
    "SELECT passwd FROM users WHERE id = $1",
    [userId]
  );

  const user = result.rows[0];
  if (!user) return false;

  const isValid = await bcrypt.compare(currentPassword, user.passwd);
  if (!isValid) return false;

  const newHashed = await bcrypt.hash(newPassword, 10);
  await executeQuery("UPDATE users SET passwd = $1 WHERE id = $2", [
    newHashed,
    userId,
  ]);

  return true;
}

export async function updateLastLogin(userId: string): Promise<boolean> {
  const query = `
    UPDATE users
    SET last_login = NOW()
    WHERE id = $1
  `;
  const result = await executeQuery(query, [userId]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Serializes like / unlike / block between two users until the end of the transaction.
 * Rows are locked in id order so that two transactions on the same pair cannot deadlock.
 * FOR NO KEY UPDATE does not block inserts referencing these users (chat, views…).
 * Returns the users found: fewer than 2 rows means one of them does not exist.
 */
export async function lockUserPair(client: PoolClient, userA: string, userB: string) {
  const result = await executeQuery<{ id: string; username: string }>(
    `SELECT id, username FROM users
     WHERE id = ANY($1::uuid[])
     ORDER BY id
     FOR NO KEY UPDATE`,
    [[userA, userB]],
    client
  );
  return result.rows;
}