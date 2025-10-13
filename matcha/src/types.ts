export type User = {
  id: string;
  email: string;
  passwordHash: string;
};

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