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
    WHERE recipient_id = $1
      AND is_read = false
    GROUP BY sender_id;
  `;
  const result = await executeQuery(query, [userId]);
  return result.rows;
}

export async function storeMessage(sender_id: string, recipient_id: string, message: string) {
  const query = `
    INSERT INTO chat (sender_id, recipient_id, message)
    VALUES ($1, $2, $3);
  `;
  await executeQuery<ChatMessage>(query, [sender_id, recipient_id, message]);
}

export async function markConversationAsRead(senderId: string, recipientId: string) {
  const query = `
    UPDATE chat
    SET is_read = true
    WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false;
  `;
  await executeQuery(query, [senderId, recipientId]);
}

// Fetch conversation between two users
// Mark messages as read when fetched
export async function getConversation(me: string, user: string): Promise<ChatMessage[]> {
  const query = `
    SELECT * FROM chat
    WHERE (sender_id = $1 AND recipient_id = $2)
       OR (sender_id = $2 AND recipient_id = $1)
    ORDER BY created_at ASC;
  `;
  const result = await executeQuery<ChatMessage>(query, [me, user]);

  const markReadQuery = `
    UPDATE chat
    SET is_read = true
    WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false;
  `;
  await executeQuery(markReadQuery, [user, me]);
  return result.rows;
}


export async function getMessagesForUser(userId: string): Promise<ChatMessage[]> {
  const query = `
    SELECT * FROM chat
    WHERE recipient_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await executeQuery<ChatMessage>(query, [userId]);
  return result.rows;
}

export async function deleteMessage(id: number): Promise<boolean> {
  const query = `DELETE FROM chat WHERE id = $1`;
  const result = await executeQuery(query, [id]);
  return (result.rowCount ?? 0) > 0;
}