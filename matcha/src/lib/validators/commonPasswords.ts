import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

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

/***
 * Load a word list from src/data, one lowercase entry per line.
 * Throws if the file is missing: a silently disabled check would let weak passwords through.
 */
function loadList(fileName: string): Set<string> {
  const candidates = [
    path.resolve(process.cwd(), "src/data", fileName),
    path.resolve(process.cwd(), "matcha/src/data", fileName),
  ];
  const source = candidates.find((candidate) => existsSync(candidate));
  if (!source) throw new Error(`Password blacklist not found: ${fileName}`);

  const list = new Set<string>();
  for (const line of readFileSync(source, "utf8").split(/\r?\n/)) {
    const entry = line.trim().toLowerCase();
    if (entry) list.add(entry);
  }
  return list;
}

const commonPasswords = loadList("top500-worst-password-ever.txt");
// ~9500 most frequent English words (3 letters or more), from google-10000-english
const commonEnglishWords = loadList("common-english-words.txt");

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

/***
 * True when the letters of the password spell a common English word, leet included:
 * "Kitchen123", "123Elephant!", "K1tch3n!"
 */
export function isCommonEnglishWord(password: string): boolean {
  const value = password.trim().toLowerCase();
  // Digits and symbols around the word are padding, not leet: "K1tch3n!" -> "k1tch3n" -> "kitchen"
  const core = value.replace(/^[^a-z]+|[^a-z]+$/g, "");

  return [value, normalizeLeet(value), normalizeLeet(core)]
    .map(lettersOnly)
    .some((letters) => commonEnglishWords.has(letters));
}
