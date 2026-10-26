// matcha/src/lib/matching.ts
import { PublicUser } from "./types";

// Beyond this distance (km), proximity no longer adds anything to the score
const MAX_DISTANCE = 1000;

/**
 * Compatibility score out of 100: proximity 40, fame 30, shared interests 30.
 * user.distance comes from SQL (distance_km), NULL when a location is missing.
 */
function calcScore(me: PublicUser, user: PublicUser): number {
  const distanceScore = user.distance === null
    ? 0
    : Math.max(0, 1 - user.distance / MAX_DISTANCE) * 40;

  const fameScore = Math.min(1, user.fame / 100) * 30;

  const maxShared = Math.max(me.interests.length, 1);
  const interestsScore = (user.commonTags / maxShared) * 30;

  return Math.round(distanceScore + fameScore + interestsScore);
}

/**
 * Set each user's shared interests count and score, and sort by best score first
 */
export function rankUsers(me: PublicUser, users: PublicUser[]): PublicUser[] {
  for (const u of users) {
    u.commonTags = u.interests.filter((i) => me.interests.includes(i)).length;
    u.score = calcScore(me, u);
  }
  return users.sort((a, b) => b.score - a.score);
}
