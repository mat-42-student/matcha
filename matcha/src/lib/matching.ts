// matcha/src/lib/matching.ts
import { PublicUser } from "./types";

// Distance (km) at which proximity is worth half its points
const HALF_DISTANCE = 50;

/**
 * Compatibility score out of 100: proximity 60, shared interests 25, fame 15.
 * Proximity comes first (subject): 1 / (1 + d / 50) gives 60 at 0 km, 30 at 50 km,
 * ~5 at 500 km, so a neighbour with nothing in common (60) still ranks above someone
 * 500 km away with every interest and full fame (~45), while distant users stay ordered.
 * user.distance comes from SQL (distance_km), NULL when a location is missing.
 */
function calcScore(me: PublicUser, user: PublicUser): number {
  const distanceScore = user.distance === null
    ? 0
    : 60 / (1 + user.distance / HALF_DISTANCE);

  const maxShared = Math.max(me.interests.length, 1);
  const interestsScore = Math.min(1, user.commonTags / maxShared) * 25;

  const fameScore = Math.min(1, user.fame / 100) * 15;

  return Math.round(distanceScore + interestsScore + fameScore);
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
