// matcha/src/lib/db/interests.ts

import { executeQuery } from "./db-utils";

export interface Interest {
  id: number;
  name: string;
}

export interface UserInterest {
  user_id: string;
  interest_id: number;
}

/**
 * Fetch all available interests
 */
export async function getAllInterests(): Promise<Interest[]> {
  const query = `
    SELECT id, name
    FROM interests
    ORDER BY name ASC;
  `;
  const result = await executeQuery<Interest>(query);
  return result.rows;
}

/**
 * Fetch all interests of a given user
 */
export async function getUserInterests(userId: string): Promise<Interest[]> {
  if (!userId) throw new Error("Missing userId");

  const query = `
    SELECT i.id, i.name
    FROM user_interests ui
    JOIN interests i ON ui.interest_id = i.id
    WHERE ui.user_id = $1
    ORDER BY i.name ASC;
  `;
  const result = await executeQuery<Interest>(query, [userId]);
  return result.rows;
}

/**
 * Update user interests atomically:
 * - delete all existing interests
 * - insert the new ones (validated)
 */
export async function updateUserInterests(userId: string, interestIds: number[]): Promise<boolean> {
  if (!userId) throw new Error("Missing userId");
  if (!Array.isArray(interestIds)) throw new Error("interestIds must be an array");

  // Clean the list (positive integers only)
  const cleanIds = interestIds
    .filter((id) => typeof id === "number" && Number.isFinite(id) && id > 0)
    .map((id) => Math.floor(id));

  // Remove old interests
  await executeQuery(`DELETE FROM user_interests WHERE user_id = $1;`, [userId]);

  // Nothing to insert → OK
  if (cleanIds.length === 0) return true;

  // Check that all provided interest IDs exist
  const existing = await executeQuery<{ id: number }>(
    `SELECT id FROM interests WHERE id = ANY($1::int[])`,
    [cleanIds]
  );
  const existingIds = existing.rows.map((r) => r.id);
  if (existingIds.length !== cleanIds.length) {
    throw new Error("One or more invalid interest IDs provided");
  }

  // Build the insert query safely
  const values = cleanIds.map((id, i) => `($1, $${i + 2})`).join(", ");
  const query = `
    INSERT INTO user_interests (user_id, interest_id)
    VALUES ${values};
  `;

  const result = await executeQuery(query, [userId, ...cleanIds]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Add a new global interest (admin use only)
 */
export async function addInterest(name: string): Promise<Interest> {
  const cleanName = name.trim();
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/.test(cleanName)) {
    throw new Error("Invalid interest name");
  }

  const query = `
    INSERT INTO interests (name)
    VALUES ($1)
    RETURNING *;
  `;
  const result = await executeQuery<Interest>(query, [cleanName]);
  return result.rows[0];
}

/**
 * Delete a global interest (admin use only)
 */
export async function deleteInterest(id: number): Promise<boolean> {
  if (!Number.isFinite(id)) throw new Error("Invalid ID");
  const query = `DELETE FROM interests WHERE id = $1;`;
  const result = await executeQuery(query, [id]);
  return (result.rowCount ?? 0) > 0;
}