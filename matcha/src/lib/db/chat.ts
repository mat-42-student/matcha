import { executeQuery } from '../db-utils';

export interface ChatMessage {
  id: number;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: Date;
}

// ➕ Envoyer un message
export async function sendMessage(sender_id: string, recipient_id: string, message: string): Promise<ChatMessage> {
  const query = `
    INSERT INTO chat (sender_id, recipient_id, message)
    VALUES ('${sender_id}', '${recipient_id}', '${message}')
    RETURNING *;
  `;
  const result = await executeQuery<ChatMessage>(query);
  return result.rows[0];
}

// 📜 Récupérer la conversation entre 2 users
export async function getConversation(user1: string, user2: string): Promise<ChatMessage[]> {
  const query = `
    SELECT * FROM chat
    WHERE (sender_id = '${user1}' AND recipient_id = '${user2}')
       OR (sender_id = '${user2}' AND recipient_id = '${user1}')
    ORDER BY created_at ASC;
  `;
  const result = await executeQuery<ChatMessage>(query);
  return result.rows;
}

// 📜 Récupérer tous les messages reçus par un user
export async function getMessagesForUser(userId: string): Promise<ChatMessage[]> {
  const query = `
    SELECT * FROM chat
    WHERE recipient_id = '${userId}'
    ORDER BY created_at DESC;
  `;
  const result = await executeQuery<ChatMessage>(query);
  return result.rows;
}

// ❌ Supprimer un message
export async function deleteMessage(id: number): Promise<boolean> {
  const query = `DELETE FROM chat WHERE id = ${id}`;
  const result = await executeQuery(query);
  return (result.rowCount ?? 0) > 0;
}