// matcha/src/lib/validators/serverValidator.ts
// TODO mutualize password check for all forms

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
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
  else if (!isStrongPassword(password))
    errors.password =
      "Password must be at least 8 characters long and include both letters and numbers";

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
  value: any
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

    case "email": {
      const str = String(value).trim();
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(str))
        return { valid: false, error: "Invalid email address" };
      return { valid: true };
    }

    case "gender": {
      if (!["M", "F"].includes(value))
        return { valid: false, error: "Must be 'M' or 'F'" };
      return { valid: true };
    }

    case "sex_pref": {
      if (!["M", "F", "B"].includes(value))
        return { valid: false, error: "Must be 'M', 'F' or 'B'" };
      return { valid: true };
    }

    case "bio": {
      const str = String(value);
      if (str.length > 500)
        return { valid: false, error: "Bio is too long (max 500 characters)" };
      return { valid: true };
    }

    default:
      return { valid: true }; // unknown fields are considered valid
  }
}

export function validatePassword(password: string) {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  //if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password must contain at least one special character");

  return errors;
}