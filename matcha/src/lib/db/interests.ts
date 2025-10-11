import { executeQuery } from "./db-utils";

export interface Interest {
  id: number;
  name: string;
}

export interface UserInterest {
  user_id: string;
  interest_id: number;
}

// --- Récupérer tous les intérêts ---
export async function getAllInterests(): Promise<Interest[]> {
  const query = `
    SELECT id, name
    FROM interests
    ORDER BY name ASC;
  `;
  const result = await executeQuery<Interest>(query);
  return result.rows;
}

// --- Récupérer les intérêts d’un utilisateur ---
export async function getUserInterests(userId: string): Promise<Interest[]> {
  const query = `
    SELECT i.id, i.name
    FROM user_interests ui
    JOIN interests i ON ui.interest_id = i.id
    WHERE ui.user_id = '${userId}'
    ORDER BY i.name ASC;
  `;
  const result = await executeQuery<Interest>(query);
  return result.rows;
}

// --- Mettre à jour les intérêts d’un utilisateur ---
export async function updateUserInterests(userId: string, interestIds: number[]): Promise<boolean> {
  // Supprimer les anciens intérêts
  await executeQuery(`DELETE FROM user_interests WHERE user_id = '${userId}';`);

  if (interestIds.length === 0) return true;

  // Réinsérer les nouveaux intérêts
  const values = interestIds.map((id) => `('${userId}', ${id})`).join(", ");
  const query = `
    INSERT INTO user_interests (user_id, interest_id)
    VALUES ${values};
  `;
  const result = await executeQuery(query);
  return (result.rowCount ?? 0) > 0;
}

// --- Ajouter un intérêt global (optionnel) ---
export async function addInterest(name: string): Promise<Interest> {
  const query = `
    INSERT INTO interests (name)
    VALUES ('${name}')
    RETURNING *;
  `;
  const result = await executeQuery<Interest>(query);
  return result.rows[0];
}

// --- Supprimer un intérêt global (optionnel) ---
export async function deleteInterest(id: number): Promise<boolean> {
  const query = `DELETE FROM interests WHERE id = ${id};`;
  const result = await executeQuery(query);
  return (result.rowCount ?? 0) > 0;
}