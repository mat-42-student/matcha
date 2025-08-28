import { Pool, /*QueryResultRow, QueryResult*/ } from 'pg';

declare global {
  // Trick pour éviter que Next recrée le pool à chaque hot reload en dev
  // (important car Next.js recharge les modules souvent en mode dev).
  var cachedPool: Pool | undefined;
}

export const pool =
  global.cachedPool ||
  new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  });

if (process.env.NODE_ENV !== "production") {
  global.cachedPool = pool;
}

// async function executeQuery<T extends QueryResultRow>(
//   queryString: string, 
// ): Promise<QueryResult<T>> {
//   const client = await pool.connect();
  
//   try {
//     const result = await client.query<T>(queryString);
//     return result;
//   } catch (error) {
//     console.error('Database query error:', {
//       query: queryString,
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//     throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   } finally {
//     client.release();
//   }
// }

// // Utility function to test the connection
// async function testConnection(): Promise<boolean> {
//   try {
//     await executeQuery('SELECT NOW()');
//     console.log('Database connection successful');
//     return true;
//   } catch (error) {
//     console.error('Database connection failed:', error);
//     return false;
//   }
// }

// export { executeQuery, testConnection, pool };