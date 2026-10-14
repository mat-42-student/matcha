import { getPictures } from "./db/pictures";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import type { PublicUser } from "@/lib/types";

export interface Completion {
  percentage: number;
  missingRequired: string[];
  missingOptional: string[];
}

export async function analyzeProfileCompletion(user: PublicUser | null): Promise<Completion> {
  if (!user) {
    return { percentage: 0, missingRequired: [], missingOptional: [] };
  }

  const pictures = await getPictures(user.id);
  const pictureCount = pictures.length;


  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  if (!user.gender) missingRequired.push("Gender not specified");
  if (!user.latitude || !user.longitude)
    missingRequired.push("Location missing");
  // required criteria are mirrored in compatible_users_from (init-db/01-matcha.sql)
  if (!Array.isArray(pictures) || pictureCount < 1)
    missingRequired.push("You need at least 1 picture");
  if (!Array.isArray(user.interests) || user.interests.length < 3)
    missingRequired.push("Fewer than 3 interests");

  if (!user.bio) missingOptional.push("Empty bio");
  if (!Array.isArray(user.interests) || user.interests.length < 5)
    missingOptional.push("Fewer than 5 interests");

  const totalCriteria = 6;
  const filledCriteria = [
    !!user.gender,
    !!user.bio,
    !!user.latitude && !!user.longitude,
    Array.isArray(pictures) && pictureCount >= 1,
    Array.isArray(user.interests) && user.interests.length >= 3,
    Array.isArray(user.interests) && user.interests.length >= 5,
  ].filter(Boolean).length;

  const percentage = Math.round((filledCriteria / totalCriteria) * 100);

  return { percentage, missingRequired, missingOptional };
}

export async function checkSessionAndCompletion() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return { user: null, completion: null };
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return { user: null, completion: null };
    }

    const completion = await analyzeProfileCompletion(user);
    return { user, completion };
  } catch (err) {
    console.error("Error checking session:", err);
    return { user: null, completion: null };
  }
}