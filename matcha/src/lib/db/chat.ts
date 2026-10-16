import { PublicUser, SocketUser, UnreadMessages } from '@/lib/types';
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
    FROM user_matches m
    JOIN users_with_interests uwi ON uwi.id = m.matched_id
    WHERE m.user_id = $1;
  `
  const result = await executeQuery<PublicUser>(query, [user]);
  return result.rows;
}

/**
 * Returns the other user if both are matched and neither blocked the other, null otherwise
 */
export async function getChatPartner(me: string, other: string): Promise<SocketUser | null> {
  const query = `
    SELECT u.id, u.first_name
    FROM users u
    WHERE u.id = $2
      AND u.id != $1
      AND EXISTS (
        SELECT 1 FROM user_matches WHERE user_id = $1 AND matched_id = $2
      )
      AND NOT is_blocked($1, $2);
  `;
  const result = await executeQuery<SocketUser>(query, [me, other]);
  return result.rows[0] ?? null;
}

export async function getUnreadCountByUsers(userId: string): Promise<UnreadMessages[]> {
  const query = `
    SELECT c.sender_id, COUNT(*)::int AS unread_count
    FROM chat c
    JOIN user_matches m
      ON m.user_id = c.recipient_id AND m.matched_id = c.sender_id
    WHERE c.recipient_id = $1
      AND c.is_read = false
    GROUP BY c.sender_id;
  `;
  const result = await executeQuery<UnreadMessages>(query, [userId]);
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
