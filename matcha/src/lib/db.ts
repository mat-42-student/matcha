// fakes db for testing purposes
export const users = [
  { id: '1', email: 'test@example.com', passwordHash: '$2b$10$...' }
];

export let sessions: { id: string, userId: string, expiresAt: Date }[] = [];
