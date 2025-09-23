export type User = {
  id: string;
  email: string;
  passwordHash: string;
  username: string; // 👈 assure-toi que la colonne existe bien dans ta DB
};

// Type exposé au front (pas de passwordHash)
export type PublicUser = {
  id: string;
  username: string;
  email: string;
  gender: string;
  city: string;
  bio: string;
  age: number;
  interests: string[];
};
