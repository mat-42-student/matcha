export interface ProfileAnalysis {
  completion: number;
  missingRequired: string[];
  missingOptional: string[];
}

export function analyzeProfileCompletion(user: any): ProfileAnalysis {
  if (!user) {
    return { completion: 0, missingRequired: [], missingOptional: [] };
  }

  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  if (!user.gender) missingRequired.push("Gender not specified");
  if (!user.sex_pref) missingRequired.push("Orientation not specified");
  if (!user.latitude || !user.longitude)
    missingRequired.push("Location missing");
  if (!Array.isArray(user.pictures) || user.pictures.length < 2)
    missingRequired.push("Less than 2 photos added");
  if (!Array.isArray(user.interests) || user.interests.length < 3)
    missingRequired.push("Fewer than 3 interests");

  if (!user.bio) missingOptional.push("Empty bio");
  if (!Array.isArray(user.interests) || user.interests.length < 5)
    missingOptional.push("Moins de 5 centres d’intérêt");

  const totalCriteria = 6;
  const filledCriteria = [
    !!user.gender,
    !!user.sex_pref,
    !!user.bio,
    !!user.latitude && !!user.longitude,
    Array.isArray(user.pictures) && user.pictures.length >= 2,
    Array.isArray(user.interests) && user.interests.length >= 3,
  ].filter(Boolean).length;

  const completion = Math.round((filledCriteria / totalCriteria) * 100);

  return { completion, missingRequired, missingOptional };
}