export type User = {
  id: number;
  email: string;
  passwordHash: string;
  username: string; // 👈 assure-toi que la colonne existe bien dans ta DB
};

// Type exposé au front (pas de passwordHash)
export type PublicUser = {
  id: number;
  email: string;
  username: string;
};