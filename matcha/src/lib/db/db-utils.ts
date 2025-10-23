// matcha/src/lib/db/db-utils.ts

import { Pool, QueryResultRow, QueryResult, PoolClient } from 'pg';
import { PublicUser } from '../types';
import { getMatchStatus } from './likes';

declare global {
  var cachedPool: Pool | undefined;
}

export const pool =
  global.cachedPool ||
  new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  });

  if (process.env.NODE_ENV !== "production") {
    global.cachedPool = pool;
}


export async function executeQuery<T extends QueryResultRow>(
  queryString: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any[] = [],
  client?: PoolClient
): Promise<QueryResult<T>> {
  const dbClient = client || (await pool.connect());

  try {
    const result = await dbClient.query<T>(queryString, values);
    return result;
  } catch (error) {
    console.error("Database query error:", {
      query: queryString,
      values,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(
      `Query execution failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    // ⚠️ On ne release que si on a créé la connexion ici
    if (!client) dbClient.release();
  }
}
// Utility function to test the connection
export async function testConnection(): Promise<boolean> {
  try {
    await executeQuery('SELECT NOW()');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function addFame(score: number, userId: string) {
  try {
    const query = `
      UPDATE users
      SET fame = LEAST(100, GREATEST(0, fame + $1))
      WHERE id = $2;`;
    const res = await pool.query(query, [score, userId]);
    return res.rowCount === 1;
  }
  catch (err) {
    console.error("Error updating fame:", err);
    return false;
  }
}

function calcDistance(refUser: PublicUser, user: PublicUser): number {
  // Haversine
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(user.latitude - refUser.latitude);
  const dLon = toRad(user.longitude - refUser.longitude);
  const lat1 = toRad(refUser.latitude);
  const lat2 = toRad(user.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  return distance
}

function calcScore(refUser: PublicUser, user: PublicUser): number {
  const maxDistance = 1000;
  const distanceScore = Math.max(0, (1 - user.distance / maxDistance)) * 40;

  const fameScore = Math.min(user.fame / 100, 1) * 20;

  const sharedInterests = user.interests.filter(i => refUser.interests.includes(i)).length;
  const maxShared = Math.max(refUser.interests.length, 1);
  const interestsScore = (sharedInterests / maxShared) * 40;

  const totalScore = Math.round(distanceScore + fameScore + interestsScore);
  return totalScore;
}

export async function completeUserInfos(refUser: PublicUser, users: PublicUser[]): Promise<PublicUser[]> {
  for (const u of users) {
    u.distance = calcDistance(refUser, u)
    u.score = calcScore(refUser, u)
    u.likeStatus = await getMatchStatus(refUser.id, u.id);
  }
  users.sort((a, b) => b.score - a.score)
  return users
}