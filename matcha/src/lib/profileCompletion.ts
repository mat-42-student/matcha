import { getPictures } from "./db/pictures";

export interface Completion {
  percentage: number;
  missingRequired: string[];
  missingOptional: string[];
}

export async function analyzeProfileCompletion(user: any): Promise<Completion> {
  if (!user) {
    return { percentage: 0, missingRequired: [], missingOptional: [] };
  }

  const pictures = await getPictures(user.id);
  const pictureCount = pictures.length;


  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  if (!user.gender) missingRequired.push("Gender not specified");
  if (!user.sex_pref) missingRequired.push("Orientation not specified");
  if (!user.latitude || !user.longitude)
    missingRequired.push("Location missing");
  if (!Array.isArray(pictures) || pictureCount < 1)
    missingRequired.push("You need at lest 1 picture");
  if (!Array.isArray(user.interests) || user.interests.length < 3)
    missingRequired.push("Fewer than 3 interests");

  if (!user.bio) missingOptional.push("Empty bio");
  if (!Array.isArray(user.interests) || user.interests.length < 5)
    missingOptional.push("Fewer than 5 interests");

  const totalCriteria = 7;
  const filledCriteria = [
    !!user.gender,
    !!user.sex_pref,
    !!user.bio,
    !!user.latitude && !!user.longitude,
    Array.isArray(pictures) && pictureCount >= 1,
    Array.isArray(user.interests) && user.interests.length >= 3,
    Array.isArray(user.interests) && user.interests.length >= 5,
  ].filter(Boolean).length;

  const percentage = Math.round((filledCriteria / totalCriteria) * 100);

  return { percentage, missingRequired, missingOptional };
}