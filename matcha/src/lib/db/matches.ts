import { executeQuery } from './db-utils';

export interface Match {
  id: number;
  user1_id: string;
  user2_id: string;
  status: string;
  created_at: Date;
}

// ➕ Créer un match
export async function createMatch(user1_id: string, user2_id: string, status = "pending"): Promise<Match> {
  const query = `
    INSERT INTO matches (user1_id, user2_id, status)
    VALUES ('${user1_id}', '${user2_id}', '${status}')
    RETURNING *;
  `;
  const result = await executeQuery<Match>(query);
  return result.rows[0];
}

// 🔍 Récupérer un match par ID
export async function getMatchById(id: number): Promise<Match | null> {
  const query = `SELECT * FROM matches WHERE id = ${id}`;
  const result = await executeQuery<Match>(query);
  return result.rows[0] || null;
}

// 📜 Liste des matchs pour un user
export async function listMatchesForUser(userId: string): Promise<Match[]> {
  const query = `
    SELECT * FROM matches 
    WHERE user1_id = '${userId}' OR user2_id = '${userId}'
  `;
  const result = await executeQuery<Match>(query);
  return result.rows;
}

// ✏️ Update statut
export async function updateMatchStatus(id: number, status: string): Promise<Match | null> {
  const query = `
    UPDATE matches
    SET status = '${status}'
    WHERE id = ${id}
    RETURNING *;
  `;
  const result = await executeQuery<Match>(query);
  return result.rows[0] || null;
}

// ❌ Supprimer
export async function deleteMatch(id: number): Promise<boolean> {
  const query = `DELETE FROM matches WHERE id = ${id}`;
  const result = await executeQuery(query);
  return (result.rowCount ?? 0) > 0;
}
