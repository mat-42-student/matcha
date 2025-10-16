// matcha/src/lib/db/users.ts
import bcrypt from 'bcryptjs';
import { executeQuery } from "./db-utils";

export interface User {
  id: string;
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
  fame?: number;
  created_at?: Date;
}

/**
 * Utilitaire pour construire une requête INSERT générique
 */
async function insertUser(user: Partial<User>, allowedFields: (keyof User)[]): Promise<User> {
  const fields = Object.keys(user)
    .filter((f) => allowedFields.includes(f as keyof User));
  
  const columns = fields.map((f) => `"${f}"`).join(", ");
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
  const values = fields.map((f) => (user as any)[f] ?? null);

  const query = `INSERT INTO users (${columns}) VALUES (${placeholders}) RETURNING *`;
  const result = await executeQuery<User>(query, values);
  return result.rows[0];
}

/**
 * Create a new user
 */
export async function createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const allowedFields: (keyof User)[] = [
    "first_name","last_name","email","passwd","country","city",
    "latitude","longitude","birthdate","gender","sex_pref","bio","fame"
  ];
  return insertUser(user, allowedFields);
}

/**
 * Update a user (partial update)
 */
export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<User | null> {
  const allowedFields: (keyof User)[] = [
    "first_name","last_name","email","city","country",
    "gender","sex_pref","bio","birthdate","latitude","longitude"
  ];

  const fields = Object.keys(updates).filter((f) => allowedFields.includes(f as keyof User));
  if (fields.length === 0) return null;

  const setClauses = fields.map((f, i) => `"${f}" = $${i + 1}`).join(", ");
  const values = fields.map((f) => (updates as any)[f]);

  const query = `UPDATE users SET ${setClauses} WHERE id = $${fields.length + 1} RETURNING *`;
  const result = await executeQuery<User>(query, [...values, id]);

  return result.rows[0] ?? null;
}

/**
 * Get user by id
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await executeQuery<User>('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await executeQuery<User>('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] ?? null;
}

/**
 * List all users
 */
export async function listUsers(): Promise<User[]> {
  const result = await executeQuery<User>('SELECT * FROM users ORDER BY created_at DESC');
  return result.rows;
}

/**
 * Try to log user
 */
export async function loginUser(email: string, password: string): Promise<User | null> {
  const result = await executeQuery<User>('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return null;

  const match = await bcrypt.compare(password, user.passwd);
  if (!match) return null;

  return user;
}

/**
 * Fetch total number of pages based on PROFILES_LIMIT
 */
export async function fetchTotalPages(): Promise<number> {
  const min_users: number = parseInt(process.env.PROFILES_LIMIT ?? "20");
  const result = await executeQuery<{ total: string }>('SELECT count(*) AS total FROM users');
  const totalUsers = parseInt(result.rows[0].total, 10);
  return Math.ceil(totalUsers / min_users);
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