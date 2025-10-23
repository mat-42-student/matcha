// matcha/src/types.ts

// export type User = {
//   id: string;
//   email: string;
//   passwordHash: string;
// };

// Type exposé au front (pas de passwordHash)
export type PublicUser = {
  id: string;
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
  likeStatus: 'match' | 'like' | 'isLiked' | 'block' | 'none';
};

export type Picture = {
  mime_type: string;
  data: string;
}

export type SearchCriteria = {
  distance?: number;
  ageRange?: [number, number];
  interests?: "similar" | "custom";
  customInterests?: string[];
  fame?: number;
};

export type LikeTabsTypes = "visitors" | "liked" | "likeMe" | "matches"

export interface Payload {
  from: PublicUser;
  to: PublicUser;
  msg: string;
}
export const COLOR = {
  match: "bg-gradient-to-tr from-pink-200 via-teal-200 to-pink-200",
  like: "bg-pink-200",
  isLiked: "bg-teal-100",
  block: "bg-gray-700",
  none: "bg-white",
}
