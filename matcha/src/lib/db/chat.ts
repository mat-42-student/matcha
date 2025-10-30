import { PublicUser, UnreadMessages } from '@/lib/types';
import { executeQuery } from './db-utils';

export interface ChatMessage {
  id: number;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: Date;
}

export async function getOnlineMatchedUsers(user: string): Promise<PublicUser[]> {
  const query = `
    SELECT uwi.*
    FROM users_with_interests uwi
    JOIN matches m
      ON (uwi.id = m.user1_id OR uwi.id = m.user2_id)
    WHERE $1 IN (m.user1_id, m.user2_id)
      AND uwi.id != $1
      AND status = 'match';
  `
  const result = await executeQuery<PublicUser>(query, [user]);
  return result.rows;
}

export async function getUnreadCountByUsers(userId: string): Promise<UnreadMessages[]> {
  const query = `
    SELECT sender_id, COUNT(*)::int AS unread_count
    FROM chat
    WHERE recipient_id = '${userId}'
      AND is_read = false
    GROUP BY sender_id;
  `;
  const result = await executeQuery(query);
  return result.rows;
}

export async function storeMessage(sender_id: string, recipient_id: string, message: string) {
  const query = `
    INSERT INTO chat (sender_id, recipient_id, message)
    VALUES ('${sender_id}', '${recipient_id}', '${message}');
  `;
  await executeQuery<ChatMessage>(query);
}

// Fetch conversation between two users
// Mark messages as read when fetched
export async function getConversation(me: string, user: string): Promise<ChatMessage[]> {
  const query = `
    SELECT * FROM chat
    WHERE (sender_id = '${me}' AND recipient_id = '${user}')
       OR (sender_id = '${user}' AND recipient_id = '${me}')
    ORDER BY created_at ASC;
  `; // Todo: Send only 10 last messages
  const result = await executeQuery<ChatMessage>(query);

  const markReadQuery = `
    UPDATE chat
    SET is_read = true
    WHERE sender_id = '${user}' AND recipient_id = '${me}' AND is_read = false;
  `;
  await executeQuery(markReadQuery);
  return result.rows;
}


export async function getMessagesForUser(userId: string): Promise<ChatMessage[]> {
  const query = `
    SELECT * FROM chat
    WHERE recipient_id = '${userId}'
    ORDER BY created_at DESC;
  `;
  const result = await executeQuery<ChatMessage>(query);
  return result.rows;
}

export async function deleteMessage(id: number): Promise<boolean> {
  const query = `DELETE FROM chat WHERE id = ${id}`;
  const result = await executeQuery(query);
  return (result.rowCount ?? 0) > 0;
}