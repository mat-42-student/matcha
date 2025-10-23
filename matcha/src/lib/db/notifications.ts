// matcha/src/lib/db/notifications.ts
import { executeQuery } from "@/lib/db/db-utils";
import { PoolClient } from "pg";

type NotificationType = "like" | "match" | "unlike" | "message";

/**
 * Create a notification for a specific user
 * Before inserting, cleans up conflicting notifications according to the type.
 */
export async function createNotification(
  targetId: string,
  senderId: string,
  type: NotificationType,
  message: string,
  client?: PoolClient
): Promise<void> {
  // Handle cleanup rules before insertion
  if (type === "like" || type === "match") {
    // Remove any unlike notifications between the two users
    await deleteNotificationsBetweenUsers(targetId, senderId, ["unlike"]);
  } else if (type === "unlike") {
    // Remove all notifications between both users
    await deleteAllNotificationsBetweenUsers(targetId, senderId);
  }

  // Create the new notification
  const query = `
    INSERT INTO notifications (target_id, sender_id, type, message)
    VALUES ($1, $2, $3, $4);
  `;

  await executeQuery(query, [targetId, senderId, type, message], client);
}

/**
 * Get all notifications for a specific user, ordered by most recent first
 */
export async function getNotificationsByUser(userId: string) {
  const query = `
    SELECT *
    FROM notifications
    WHERE target_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await executeQuery(query, [userId]);
  return result.rows;
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


export async function deleteNotificationsBetweenUsers(
  userA: string,
  userB: string,
  types: NotificationType[]
): Promise<void> {
  const query = `
    DELETE FROM notifications
    WHERE ((target_id = $1 AND sender_id = $2)
        OR (target_id = $2 AND sender_id = $1))
      AND type = ANY($3::notification_type[]);
  `;

  await executeQuery(query, [userA, userB, types]);
}

/**
 * Delete all notifications exchanged between two users (regardless of type)
 */
export async function deleteAllNotificationsBetweenUsers(
  userA: string,
  userB: string
): Promise<void> {
  const query = `
    DELETE FROM notifications
    WHERE (target_id = $1 AND sender_id = $2)
       OR (target_id = $2 AND sender_id = $1);
  `;

  await executeQuery(query, [userA, userB]);
}