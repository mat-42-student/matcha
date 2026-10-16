// matcha/src/lib/db/db-utils.ts

import { Pool, QueryResultRow, QueryResult, PoolClient } from 'pg';

declare global {
  var cachedPool: Pool | undefined;
}

function createPool(): Pool {
  const newPool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  });
  // An idle client losing its connection emits "error" on the pool: without a listener it crashes the process
  newPool.on("error", (err) => console.error("Idle database client error:", err));
  return newPool;
}

export const pool = global.cachedPool || createPool();

  if (process.env.NODE_ENV !== "production") {
    global.cachedPool = pool;
}


export async function executeQuery<T extends QueryResultRow>(
  queryString: string,
  values: unknown[] = [],
  client?: PoolClient
): Promise<QueryResult<T>> {
  const dbClient = client || (await pool.connect());

  try {
    const result = await dbClient.query<T>(queryString, values);
    return result;
  } catch (error) {
    // values are never logged (password hashes, tokens, image buffers)
    console.error("Database query error:", {
      query: queryString,
      error: error instanceof Error ? error.message : "Unknown error",
      code: (error as { code?: string }).code,
    });
    // rethrown as is: callers rely on the pg error code (e.g. 23505 unique violation)
    throw error;
  } finally {
    // ⚠️ On ne release que si on a créé la connexion ici
    if (!client) dbClient.release();
  }
}

/**
 * Inside a transaction (client given), errors are rethrown so the caller rolls back
 */
export async function addFame(score: number, userId: string, client?: PoolClient) {
  try {
    const query = `
      UPDATE users
      SET fame = LEAST(100, GREATEST(0, fame + $1))
      WHERE id = $2;`;
    const res = await executeQuery(query, [score, userId], client);
    return res.rowCount === 1;
  }
  catch (err) {
    if (client) throw err;
    console.error("Error updating fame:", err);
    return false;
  }
}
