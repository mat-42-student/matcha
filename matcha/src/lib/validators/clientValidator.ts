// lib/validators/clientValidator.ts
// All messages and comments in English

export function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_]{3,20}$/.test(username);
}

export function validateProfileField(field: string, value: string) {
  switch (field) {
    case "username":
      if (!isValidUsername(value))
        return { valid: false, error: "3-20 letters, numbers or underscores" };
      return { valid: true };
    case "first_name":
    case "last_name":
      if (!value || value.trim().length < 2) return { valid: false, error: "Too short" };
      if (/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/.test(value.trim()))
        return { valid: false, error: "Invalid characters" };
      return { valid: true };
    case "email":
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
        return { valid: false, error: "Invalid email" };
      return { valid: true };
    case "bio":
      if (value.length > 500) return { valid: false, error: "Bio is too long (max 500 characters)" };
      return { valid: true };
    case "gender":
      if (!["M", "F"].includes(value)) return { valid: false, error: "Invalid gender" };
      return { valid: true };
    case "sex_pref":
      if (!["M", "F", "B"].includes(value))
        return { valid: false, error: "Invalid sexual preference" };
      return { valid: true };
    default:
      return { valid: true };
  }
}