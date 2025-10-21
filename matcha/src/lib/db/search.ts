// matcha/src/lib/db/search.ts
import { executeQuery } from "./db-utils";
import { QueryResultRow } from "pg";
import { PublicUser } from "@/lib/types";

/**
 * Perform a user search based on filters such as distance, age, fame, and interests.
 */
export async function searchCompatibleUsers(
  userId: string,
  distance?: number,
  ageRange?: [number, number],
  fame?: number,
  interests?: string,
  customInterests: string[] = []
) {
  let query = `
    SELECT *
    FROM compatible_users_from($1) AS c
    WHERE 1=1
  `;
  const params: [string | string[] | number] = [userId];

  // Distance filter (ignore values over 500 km)
  if (distance && distance < 500) {
    query += ` AND c.distance <= $${params.length + 1}`;
    params.push(distance);
  }

  // Age range filter
  if (ageRange) {
    query += ` AND c.age >= $${params.length + 1}`;
    params.push(ageRange[0]);
    query += ` AND c.age <= $${params.length + 1}`;
    params.push(ageRange[1]);
  }

  // Fame score filter (fame ranges 0–100, DB uses 0–2000)
  if (fame) {
    query += ` AND c.fame >= $${params.length + 1}`;
    params.push((fame - 1) * 20);
  }

  // Shared interests filter
  if (interests === "similar") {
    query += ` AND EXISTS (
      SELECT 1
      FROM user_interests ui_me
      JOIN user_interests ui_them ON ui_them.interest_id = ui_me.interest_id
      WHERE ui_me.user_id = $1 AND ui_them.user_id = c.id
    )`;
  }

  // Custom interests filter
  if (interests === "custom" && customInterests.length > 0) {
    query += ` AND (
      SELECT ARRAY_AGG(value)
      FROM jsonb_array_elements_text(interests::jsonb) AS t(value)
    ) && $${params.length + 1}`;
    params.push(customInterests);
  }

  const result = await executeQuery<QueryResultRow>(query, params);
  return result.rows;
}





export async function getCompatibleUsers(userId: string): Promise<PublicUser[]> {
  const query = `
    SELECT * 
    FROM compatible_users_from($1);
  `;
  const result = await executeQuery<QueryResultRow>(query, [userId]);
  return result.rows as PublicUser[];
}