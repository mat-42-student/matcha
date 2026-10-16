// matcha/src/lib/db/search.ts
import { executeQuery } from "./db-utils";
import { QueryResultRow } from "pg";
import { FameRange, PublicUser } from "@/lib/types";
import { completeUserInfos } from "./db-utils";

// Distinct fake-account reports after which a user is hidden from suggestions and search
const REPORT_THRESHOLD = Number(process.env.REPORT_THRESHOLD) || 2;

/**
 * Perform a user search based on filters such as distance, age, fame, and interests.
 */
export async function searchCompatibleUsers(
  me: PublicUser,
  distance?: number,
  ageRange?: [number, number],
  fameRange?: FameRange,
  interests?: string,
  customInterests: string[] = []
) {
  let query = `
    SELECT *
    FROM compatible_users_from($1, $2) AS c
    WHERE 1=1
  `;

  const params: (string | string[] | number | number[])[] = [me.id, REPORT_THRESHOLD];

  // Age range filter
  if (ageRange) {
    query += ` AND c.age >= $${params.length + 1}`;
    params.push(ageRange[0]);
    query += ` AND c.age <= $${params.length + 1}`;
    params.push(ageRange[1]);
  }

  // Fame range filter (raw fame score)
  if (fameRange?.min !== undefined) {
    query += ` AND c.fame >= $${params.length + 1}`;
    params.push(fameRange.min);
  }
  if (fameRange?.max !== undefined) {
    query += ` AND c.fame <= $${params.length + 1}`;
    params.push(fameRange.max);
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
  const {rows} = await executeQuery<PublicUser>(query, params);
  const users = await completeUserInfos(me, rows);
  if (distance)
    return users.filter( u => u.distance < distance)
  return users;
}

export async function getCompatibleUsers(userId: string): Promise<PublicUser[]> {
  const query = `
    SELECT * 
    FROM compatible_users_from($1, $2);
  `;
  const result = await executeQuery<QueryResultRow>(query, [userId, REPORT_THRESHOLD]);
  return result.rows as PublicUser[];
}