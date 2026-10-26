// matcha/src/types.ts

// export type User = {
//   id: string;
//   email: string;
//   passwordHash: string;
// };

export interface Notification {
  id: number;
  type: "like" | "match" | "unlike" | "message" | "view";
  message: string;
  sender_username?: string;
  sender_picture?: string;
  created_at: string;
}

export type LikeStatus = 'match' | 'like' | 'isLiked' | 'block' | 'none';

export interface RelationChangedPayload {
  userId: string;
  likeStatus: LikeStatus;
}

// A match connected (first tab) or disconnected (last tab)
export interface PresencePayload {
  userId: string;
  online: boolean;
}

export type PublicUser = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  city: string;
  latitude: number;
  longitude: number;
  distance: number;
  bio: string;
  age: number;
  sex_pref: string;
  interests: string[];
  fame: number;
  score: number;
  // number of interests shared with the viewer, set by rankUsers
  commonTags: number;
  likeStatus: LikeStatus;
  last_login: string | Date;
};

// Row of GET /api/me/blocks
export type BlockedUser = {
  id: string;
  username: string;
  first_name: string;
  blocked_at: string | Date;
};

// Content served by /api/pictures/:id
export type Picture = {
  id: number;
  is_main?: boolean;
}

export type SearchCriteria = {
  distance?: number;
  ageRange?: [number, number];
  interests?: "similar" | "custom";
  customInterests?: string[];
  fameRange?: FameRange;
};

// raw fame score, same unit as the ⭐ shown on cards ; undefined bound = no limit
export type FameRange = {
  min?: number;
  max?: number;
};

export type LikeTabsTypes = "visitors" | "liked" | "likeMe" | "matches"

export function notificationTypeToTab(notificationType: string): LikeTabsTypes {
  switch (notificationType) {
    case "like":
      return "likeMe";
    case "match":
      return "matches";
    case "view":
      return "visitors";
    default:
      return "visitors";
  }
}

// Identity exposed to other users through sockets (never the full profile: it contains the email)
export type SocketUser = Pick<PublicUser, "id" | "first_name">;

export interface Payload {
  from: SocketUser;
  to: SocketUser;
  msg: string;
}

export interface NotifPayload {
  from: SocketUser;
  msg: string;
}

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_INTEREST_LENGTH = 30;

// Sent by the client: the sender is always the socket's session user
export interface ChatMsgEvent {
  to: string;
  msg: string;
}

export type UnreadMessages = {
  sender_id: string;
  unread_count: number;
};

export const COLOR = {
  match: "bg-gradient-to-tr from-pink-200 via-yellow-100 to-teal-200",
  like: "bg-pink-200",
  isLiked: "bg-teal-100",
  block: "bg-gray-700",
  none: "bg-white",
}