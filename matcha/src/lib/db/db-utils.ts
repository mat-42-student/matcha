import { Pool, QueryResultRow, QueryResult } from 'pg';

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

export async function executeQuery<T extends QueryResultRow>(
  queryString: string,
  values: any[] = []   // 👈 ajout des valeurs
): Promise<QueryResult<T>> {
  const client = await pool.connect(); 
  
  try {
    const result = await client.query<T>(queryString, values);
    return result;
  } catch (error) {
    console.error('Database query error:', {
      query: queryString,
      values, // 👈 log les valeurs aussi
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    client.release();
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

