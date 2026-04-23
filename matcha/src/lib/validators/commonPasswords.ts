import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";

const commonPasswords = new Set<string>();

const LEET_CHAR_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

try {
  const candidates = [
    path.resolve(process.cwd(), "src/data/top500-worst-password-ever.txt"),
    path.resolve(process.cwd(), "matcha/src/data/top500-worst-password-ever.txt"),
    new URL("../../data/top500-worst-password-ever.txt", import.meta.url),
  ];

  const source = candidates.find((candidate) => {
    if (candidate instanceof URL) {
      try {
        readFileSync(candidate, "utf8");
        return true;
      } catch {
        return false;
      }
    }

    return existsSync(candidate);
  });

  if (!source) {
    throw new Error("Common password file not found");
  }

  const contents = readFileSync(source, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const password = line.trim().toLowerCase();
    if (password) {
      commonPasswords.add(password);
    }
  }
} catch (error) {
  console.warn("Unable to load common password blacklist", error);
}

function normalizeLeet(value: string): string {
  return value
    .split("")
    .map((char) => LEET_CHAR_MAP[char] ?? char)
    .join("");
}

function lettersOnly(value: string): string {
  return value.replace(/[^a-z]/g, "");
}

function hasOnlyDigitsOrSymbols(value: string): boolean {
  return /^[^a-z]*$/.test(value);
}

function isCloseVariant(value: string): boolean {
  // Catch variants like "password01", "01password", "p@ssword", etc.
  const normalized = normalizeLeet(value);
  const alphaOnly = lettersOnly(value);
  const normalizedAlphaOnly = lettersOnly(normalized);

  if (
    commonPasswords.has(normalized) ||
    commonPasswords.has(alphaOnly) ||
    commonPasswords.has(normalizedAlphaOnly)
  ) {
    return true;
  }

  for (const weak of commonPasswords) {
    if (value.startsWith(weak)) {
      const suffix = value.slice(weak.length);
      if (suffix.length > 0 && suffix.length <= 4 && hasOnlyDigitsOrSymbols(suffix)) {
        return true;
      }
    }

    if (value.endsWith(weak)) {
      const prefix = value.slice(0, value.length - weak.length);
      if (prefix.length > 0 && prefix.length <= 4 && hasOnlyDigitsOrSymbols(prefix)) {
        return true;
      }
    }
  }

  return false;
}

export function isCommonPassword(password: string): boolean {
  const value = password.trim().toLowerCase();
  if (!value) {
    return false;
  }

  return commonPasswords.has(value) || isCloseVariant(value);
}