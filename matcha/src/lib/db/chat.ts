import { PublicUser, SocketUser, UnreadMessages } from '@/lib/types';
import { executeQuery } from './db-utils';
import { deleteMessageNotification } from './notifications';

export interface ChatMessage {
  id: number;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: Date;
}

export async function getOnlineMatchedUsers(user: string): Promise<PublicUser[]> {
  // last_login only goes to matches: nobody else may follow when a user connects
  const query = `
    SELECT uwi.*, u.last_login
    FROM user_matches m
    JOIN users_with_interests uwi ON uwi.id = m.matched_id
    JOIN users u ON u.id = m.matched_id
    WHERE m.user_id = $1;
  `
  const result = await executeQuery<PublicUser>(query, [user]);
  return result.rows;
}

/**
 * Ids of the users matched with userId: the only ones told when userId connects or disconnects
 */
export async function getMatchIds(userId: string): Promise<string[]> {
  const result = await executeQuery<{ matched_id: string }>(
    `SELECT matched_id FROM user_matches WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map((row) => row.matched_id);
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

// Returns the id of the message: the client uses it to merge live messages with the loaded history
export async function storeMessage(sender_id: string, recipient_id: string, message: string): Promise<number> {
  const query = `
    INSERT INTO chat (sender_id, recipient_id, message)
    VALUES ($1, $2, $3)
    RETURNING id;
  `;
  const result = await executeQuery<Pick<ChatMessage, "id">>(query, [sender_id, recipient_id, message]);
  return result.rows[0].id;
}

/**
 * Mark the messages of senderId to recipientId as read, and drop the matching "message" notification.
 * Returns true when a notification was deleted: the recipient's bell must then be refreshed.
 */
export async function markConversationAsRead(senderId: string, recipientId: string): Promise<boolean> {
  const query = `
    UPDATE chat
    SET is_read = true
    WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false;
  `;
  await executeQuery(query, [senderId, recipientId]);
  return deleteMessageNotification(recipientId, senderId);
}

// Fetch conversation between two users (read only: the chat-mark-read socket event marks it read)
export async function getConversation(me: string, user: string): Promise<ChatMessage[]> {
  const query = `
    SELECT * FROM chat
    WHERE (sender_id = $1 AND recipient_id = $2)
       OR (sender_id = $2 AND recipient_id = $1)
    ORDER BY created_at ASC;
  `;
  const result = await executeQuery<ChatMessage>(query, [me, user]);
  return result.rows;
}
