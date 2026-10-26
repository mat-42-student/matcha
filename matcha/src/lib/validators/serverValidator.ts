// matcha/src/lib/validators/serverValidator.ts

import { isCommonEnglishWord, isCommonPassword } from "./commonPasswords";
import { MAX_INTEREST_LENGTH } from "@/lib/types";

export function isValidEmail(email: string): boolean {
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_]{3,20}$/.test(username);
}

export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// upper bound of a Postgres INT column (ids of interests, notifications, pictures)
const MAX_DB_INT = 2147483647;

/**
 * Id of a row with an INT identity column: a positive integer that fits in Postgres INT
 */
export function isValidDbId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= MAX_DB_INT;
}

/**
 * Same as isValidDbId, for an id read from the URL ("12")
 */
export function parseDbId(value: string): number | null {
  if (!/^\d{1,10}$/.test(value)) return null;
  const id = Number(value);
  return isValidDbId(id) ? id : null;
}

// same limit as the varchar(50) columns of users
export const NAME_MAX_LENGTH = 50;

/**
 * First or last name, trimmed. Mirrors the CHECK of users.first_name / last_name.
 */
function validateName(value: unknown, label: string): ValidationResult {
  if (typeof value !== "string") return { valid: false, error: `Invalid ${label.toLowerCase()}` };
  const name = value.trim();
  if (!name) return { valid: false, error: `${label} is required` };
  if (name.length < 2) return { valid: false, error: `${label} must contain at least 2 characters` };
  if (name.length > NAME_MAX_LENGTH)
    return { valid: false, error: `${label} is too long (max ${NAME_MAX_LENGTH} characters)` };
  if (/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/.test(name))
    return { valid: false, error: `${label} can only contain letters, spaces, hyphens, and apostrophes` };
  return { valid: true, value: name };
}

const MIN_AGE = 18;
const MAX_AGE = 100;

// "YYYY-MM-DD" of the given date (UTC, the time zone of the Postgres container)
function toIsoDate(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// today minus `years` years, the 29th of February becoming the 28th like Postgres' `current_date - interval`
function yearsAgo(years: number): string {
  const now = new Date();
  const y = now.getUTCFullYear() - years;
  const m = now.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return toIsoDate(y, m, Math.min(now.getUTCDate(), lastDay));
}

/**
 * Birthdate "YYYY-MM-DD" of a user aged 18 to 100. Mirrors the CHECK of users.birthdate
 * (dates compared as strings, which is the date order for this format).
 * @returns an error message, or null if valid
 */
function birthdateError(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return "Invalid birthdate format";
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // rejects the dates that do not exist, such as 2001-02-30 (Date would roll it over to March)
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d)
    return "Invalid birthdate";
  if (value > yearsAgo(MIN_AGE)) return `You must be at least ${MIN_AGE} years old`;
  if (value < yearsAgo(MAX_AGE)) return "Age seems invalid";
  return null;
}

export function validateSignupData(data: {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  birthdate?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const username = data.username ?? "";
  const email = data.email?.trim() ?? "";
  const password = data.password ?? "";
  const birth = data.birthdate ?? "";

  if (!username) errors.username = "Username is required";
  else if (!isValidUsername(username))
    errors.username = "Username must be 3-20 characters: letters, numbers or underscores";

  if (!email) errors.email = "Email is required";
  else if (!isValidEmail(email)) errors.email = "Invalid email address";

  if (!password) errors.password = "Password is required";
  else {
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) errors.password = passwordErrors[0];
  }

  const first = validateName(data.first_name ?? "", "First name");
  if (!first.valid) errors.first_name = first.error ?? "Invalid first name";

  const last = validateName(data.last_name ?? "", "Last name");
  if (!last.valid) errors.last_name = last.error ?? "Invalid last name";

  if (!birth) errors.birthdate = "Birthdate is required";
  else {
    const error = birthdateError(birth);
    if (error) errors.birthdate = error;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  // cleaned value to store instead of the one received (trimmed names)
  value?: unknown;
}

export function validateProfileField(
  field: string,
  value: unknown
): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: false, error: "Empty field" };
  }

  switch (field) {
    case "username": {
      if (typeof value !== "string" || !isValidUsername(value))
        return { valid: false, error: "Must be 3-20 characters: letters, numbers or underscores" };
      return { valid: true };
    }

    case "first_name":
    case "last_name":
      return validateName(value, field === "first_name" ? "First name" : "Last name");

    case "birthdate": {
      const error = birthdateError(value);
      return error ? { valid: false, error } : { valid: true };
    }

    case "latitude":
    case "longitude": {
      const max = field === "latitude" ? 90 : 180;
      if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > max)
        return { valid: false, error: `Invalid ${field}` };
      return { valid: true };
    }

    case "city":
    case "country": {
      const max = field === "city" ? 50 : 30;
      if (typeof value !== "string")
        return { valid: false, error: `Invalid ${field}` };
      if (value.length > max)
        return { valid: false, error: `${field} is too long (max ${max} characters)` };
      if (/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/.test(value))
        return { valid: false, error: "Contains invalid characters" };
      return { valid: true };
    }

    case "gender": {
      if (value !== "M" && value !== "F")
        return { valid: false, error: "Must be 'M' or 'F'" };
      return { valid: true };
    }

    case "sex_pref": {
      if (value !== "M" && value !== "F" && value !== "B")
        return { valid: false, error: "Must be 'M', 'F' or 'B'" };
      return { valid: true };
    }

    case "bio": {
      if (typeof value !== "string")
        return { valid: false, error: "Invalid bio" };
      if (value.length > 500)
        return { valid: false, error: "Bio is too long (max 500 characters)" };
      return { valid: true };
    }

    default:
      // email goes through /api/e-mail/change-request
      return { valid: false, error: `Field '${field}' cannot be updated` };
  }
}

/***
 * Validate the name of a new interest tag. A leading "#" is dropped and spaces are collapsed.
 * @returns the cleaned name, or null if it is invalid
 */
export function cleanInterestName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/^#+/, "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > MAX_INTEREST_LENGTH) return null;
  // Letters (accents included), digits, spaces, ' & -; must start with a letter or a digit
  return /^[\p{L}\p{N}][\p{L}\p{N} '&-]*$/u.test(name) ? name : null;
}

// single password policy, shared by signup, password change and password reset
export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  if (isCommonPassword(password)) errors.push("Password is too common");
  else if (isCommonEnglishWord(password)) errors.push("Password must not be a common English word");

  return errors;
}

// same bounds as user_fame()
const MAX_FAME = 100;
// half of the Earth's circumference: no two places are further apart
const MAX_DISTANCE_KM = 20000;

function isFameBound(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_FAME;
}

export function validateFameRange(range: unknown): ValidationResult {
  if (range === undefined) return { valid: true };
  if (typeof range !== "object" || range === null)
    return { valid: false, error: "Invalid fame range" };

  const { min, max } = range as { min?: unknown; max?: unknown };
  if (min !== undefined && !isFameBound(min))
    return { valid: false, error: `Minimum fame must be a whole number between 0 and ${MAX_FAME}` };
  if (max !== undefined && !isFameBound(max))
    return { valid: false, error: `Maximum fame must be a whole number between 0 and ${MAX_FAME}` };
  if (isFameBound(min) && isFameBound(max) && min > max)
    return { valid: false, error: "Minimum fame is greater than maximum" };

  return { valid: true };
}

const MAX_SEARCH_INTERESTS = 50;

// body of POST /api/search, cf. SearchCriteria ; every field is optional
export function validateSearchCriteria(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body))
    return { valid: false, error: "Invalid search criteria" };

  const { distance, ageRange, fameRange, interests, customInterests } =
    body as Record<string, unknown>;

  if (distance !== undefined
    && !(typeof distance === "number" && Number.isInteger(distance)
      && distance >= 0 && distance <= MAX_DISTANCE_KM))
    return { valid: false, error: `Distance must be a whole number of km between 0 and ${MAX_DISTANCE_KM}` };

  if (ageRange !== undefined) {
    if (!Array.isArray(ageRange) || ageRange.length !== 2)
      return { valid: false, error: "Invalid age range" };
    const [min, max] = ageRange;
    const isAge = (n: unknown): n is number =>
      typeof n === "number" && Number.isInteger(n) && n >= MIN_AGE && n <= MAX_AGE;
    if (!isAge(min) || !isAge(max))
      return { valid: false, error: `Ages must be whole numbers between ${MIN_AGE} and ${MAX_AGE}` };
    if (min > max)
      return { valid: false, error: "Minimum age is greater than maximum" };
  }

  const fameCheck = validateFameRange(fameRange);
  if (!fameCheck.valid) return fameCheck;

  if (interests !== undefined && interests !== "similar" && interests !== "custom")
    return { valid: false, error: "Invalid interests mode" };

  if (customInterests !== undefined
    && !(Array.isArray(customInterests)
      && customInterests.length <= MAX_SEARCH_INTERESTS
      && customInterests.every((i) => typeof i === "string" && i.length <= MAX_INTEREST_LENGTH)))
    return { valid: false, error: "Invalid interests" };

  return { valid: true };
}
