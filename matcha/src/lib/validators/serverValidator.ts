// matcha/src/lib/validators/serverValidator.ts
// TODO mutualize password check for all forms

import { isCommonPassword } from "./commonPasswords";

export function isValidEmail(email: string): boolean {
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function isAcceptablePassword(password: string): boolean {
  return isStrongPassword(password) && !isCommonPassword(password);
}

function calculateAgeISO(dateStr: string): number | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function validateSignupData(data: {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  birthdate?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

  const email = data.email?.trim() ?? "";
  const password = data.password ?? "";
  const first = data.first_name?.trim() ?? "";
  const last = data.last_name?.trim() ?? "";
  const birth = data.birthdate ?? "";

  if (!email) errors.email = "Email is required";
  else if (!isValidEmail(email)) errors.email = "Invalid email address";

  if (!password) errors.password = "Password is required";
  else if (!isAcceptablePassword(password))
    errors.password = isCommonPassword(password)
      ? "Password is too common"
      : "Password must be at least 8 characters long and include both letters and numbers";

  if (!first) errors.first_name = "First name is required";
  else if (!nameRegex.test(first))
    errors.first_name =
      "First name can only contain letters, spaces, hyphens, and apostrophes";
  else if (first.length > 50) errors.first_name = "First name is too long";

  if (!last) errors.last_name = "Last name is required";
  else if (!nameRegex.test(last))
    errors.last_name =
      "Last name can only contain letters, spaces, hyphens, and apostrophes";
  else if (last.length > 50) errors.last_name = "Last name is too long";

  if (!birth) errors.birthdate = "Birthdate is required";
  else {
    const age = calculateAgeISO(birth);
    if (age === null) errors.birthdate = "Invalid birthdate format";
    else if (age < 18) errors.birthdate = "You must be at least 18 years old";
    else if (age > 100) errors.birthdate = "Age seems invalid";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateProfileField(
  field: string,
  value: unknown
): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: false, error: "Empty field" };
  }

  switch (field) {
    case "first_name":
    case "last_name": {
      const str = String(value).trim();
      if (str.length < 2)
        return { valid: false, error: "Must contain at least 2 characters" };
      if (/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/.test(str))
        return { valid: false, error: "Contains invalid characters" };
      return { valid: true };
    }

    case "birthdate": {
      if (typeof value !== "string")
        return { valid: false, error: "Invalid birthdate format" };
      const age = calculateAgeISO(value);
      if (age === null) return { valid: false, error: "Invalid birthdate format" };
      if (age < 18) return { valid: false, error: "You must be at least 18 years old" };
      if (age > 100) return { valid: false, error: "Age seems invalid" };
      return { valid: true };
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

export function validatePassword(password: string) {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  if (isCommonPassword(password)) errors.push("Password is too common");
  //if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password must contain at least one special character");

  return errors;
}
function isFameBound(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function validateFameRange(range: unknown): ValidationResult {
  if (range === undefined) return { valid: true };
  if (typeof range !== "object" || range === null)
    return { valid: false, error: "Invalid fame range" };

  const { min, max } = range as { min?: unknown; max?: unknown };
  if (min !== undefined && !isFameBound(min))
    return { valid: false, error: "Invalid minimum fame" };
  if (max !== undefined && !isFameBound(max))
    return { valid: false, error: "Invalid maximum fame" };
  if (isFameBound(min) && isFameBound(max) && min > max)
    return { valid: false, error: "Minimum fame is greater than maximum" };

  return { valid: true };
}
