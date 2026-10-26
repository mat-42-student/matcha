// matcha/src/lib/db/notifications.ts
import { executeQuery } from "@/lib/db/db-utils";
import { PoolClient } from "pg";

type NotificationType = "like" | "match" | "unlike" | "message" | "view";

/**
 * True when targetId unliked senderId: senderId no longer notifies targetId (subject IV.5)
 */
export async function isNotificationMuted(
  targetId: string,
  senderId: string,
  client?: PoolClient
): Promise<boolean> {
  const result = await executeQuery(
    `SELECT 1 FROM unlikes WHERE user_id = $1 AND unliked_id = $2`,
    [targetId, senderId],
    client
  );
  return result.rowCount === 1;
}

/**
 * Create a notification for a specific user
 * Before inserting, cleans up conflicting notifications according to the type.
 * Returns false when nothing was created (targetId unliked senderId): no real-time notif either.
 */
export async function createNotification(
  targetId: string,
  senderId: string,
  type: NotificationType,
  message: string,
  client?: PoolClient
): Promise<boolean> {
  if (await isNotificationMuted(targetId, senderId, client)) return false;

  // Handle cleanup rules before insertion
  if (type === "like" || type === "match") {
    // Like/match should replace prior view or unlike notifications between the same users.
    await deleteNotificationsBetweenUsers(targetId, senderId, ["unlike", "view"], client);
  } else if (type === "unlike") {
    // Remove all notifications between both users
    await deleteAllNotificationsBetweenUsers(targetId, senderId, client);
  } else if (type === "message") {
    // Keep a single message notification per conversation: the latest one
    await deleteMessageNotification(targetId, senderId, client);
  }

  // Create the new notification
  const query = `
    INSERT INTO notifications (target_id, sender_id, type, message)
    VALUES ($1, $2, $3, $4);
  `;

  await executeQuery(query, [targetId, senderId, type, message], client);
  return true;
}

/**
 * Delete the "message" notification of senderId in the bell of targetId (conversation read).
 * Returns true when a row was deleted.
 */
export async function deleteMessageNotification(
  targetId: string,
  senderId: string,
  client?: PoolClient
): Promise<boolean> {
  const result = await executeQuery(
    `DELETE FROM notifications WHERE target_id = $1 AND sender_id = $2 AND type = 'message';`,
    [targetId, senderId],
    client
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Get all notifications for a specific user, ordered by most recent first
 */
export async function getNotificationsByUser(userId: string) {
  const query = `
    SELECT n.*, u.username AS sender_username
    FROM notifications n
    LEFT JOIN users u ON u.id = n.sender_id
    WHERE n.target_id = $1
    ORDER BY n.created_at DESC;
  `;

  const result = await executeQuery(query, [userId]);
  return result.rows;
}

/**
 * Mark the notifications of a user as read, up to the most recent one they have seen
 * (a notification created after the bell was opened stays unread).
 * Returns true when at least one row changed.
 */
export async function markNotificationsAsRead(userId: string, upToId: number): Promise<boolean> {
  const result = await executeQuery(
    `UPDATE notifications SET is_read = true WHERE target_id = $1 AND id <= $2 AND NOT is_read;`,
    [userId, upToId]
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Delete all notifications for a given user
 */
export async function deleteAllNotificationsByUser(userId: string): Promise<void> {
  const query = `
    DELETE FROM notifications
    WHERE target_id = $1;
  `;

  await executeQuery(query, [userId]);
}

/**
 * Delete one notification if it belongs to the given user.
 * Returns true when a row was deleted.
 */
export async function deleteNotificationByIdForUser(
  notificationId: number,
  userId: string
): Promise<boolean> {
  const query = `
    DELETE FROM notifications
    WHERE id = $1
      AND target_id = $2
    RETURNING id;
  `;

  const result = await executeQuery(query, [notificationId, userId]);
  return (result.rowCount ?? 0) > 0;
}


export async function deleteNotificationsBetweenUsers(
  userA: string,
  userB: string,
  types: NotificationType[],
  client?: PoolClient
): Promise<void> {
  const query = `
    DELETE FROM notifications
    WHERE ((target_id = $1 AND sender_id = $2)
        OR (target_id = $2 AND sender_id = $1))
      AND type = ANY($3::notification_type[]);
  `;

  await executeQuery(query, [userA, userB, types], client);
}

/**
 * Delete all notifications exchanged between two users (regardless of type)
 */
export async function deleteAllNotificationsBetweenUsers(
  userA: string,
  userB: string,
  client?: PoolClient
): Promise<void> {
  const query = `
    DELETE FROM notifications
    WHERE (target_id = $1 AND sender_id = $2)
       OR (target_id = $2 AND sender_id = $1);
  `;

  await executeQuery(query, [userA, userB], client);
}