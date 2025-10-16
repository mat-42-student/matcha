// lib/validators/clientValidator.ts
// All messages and comments in English

export type ValidationErrors = Partial<Record<string, string>>;

/**
 * Calculate age in full years from a birthdate string (YYYY-MM-DD).
 * Uses year/month/day comparison to avoid fractional-year approximations.
 */
export function calculateAgeISO(birthdateISO: string): number | null {
  const parts = birthdateISO.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map((p) => parseInt(p, 10));
  if ([y, m, d].some((n) => Number.isNaN(n))) return null;

  const today = new Date();
  const birth = new Date(y, m - 1, d);
  if (isNaN(birth.getTime())) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function isValidEmail(email: string): boolean {
  // simple, pragmatic regex for client side only (server must re-check)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
 
export function isStrongPassword(pw: string): boolean {
  // Example policy: at least 8 chars, one letter, one digit
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pw);
}

export function validateSignupForm(fields: {
  email?: string | null;
  password?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birthdate?: string | null;
}): { valid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  const email = fields.email?.trim() ?? '';
  const password = fields.password ?? '';
  const first = fields.first_name?.trim() ?? '';
  const last = fields.last_name?.trim() ?? '';
  const birth = fields.birthdate ?? '';

  // ✅ regex for names (letters only, allow accents, spaces, apostrophes, and hyphens)
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

  if (!email) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Invalid email address';

  if (!password) errors.password = 'Password is required';
  else if (!isStrongPassword(password))
    errors.password =
      'Password must be at least 8 characters and include letters and numbers';

  if (!first) errors.first_name = 'First name is required';
  else if (first.length > 50) errors.first_name = 'First name is too long';
  else if (!nameRegex.test(first))
    errors.first_name = 'First name can contain only letters, spaces, hyphens, and apostrophes';

  if (!last) errors.last_name = 'Last name is required';
  else if (last.length > 50) errors.last_name = 'Last name is too long';
  else if (!nameRegex.test(last))
    errors.last_name = 'Last name can contain only letters, spaces, hyphens, and apostrophes';

  if (!birth) {
    errors.birthdate = 'Birthdate is required';
  } else {
    const age = calculateAgeISO(birth);
    if (age === null) errors.birthdate = 'Invalid birthdate format';
    else {
      if (age < 18) errors.birthdate = 'You must be at least 18 years old';
      if (age > 120) errors.birthdate = 'Age seems invalid';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}