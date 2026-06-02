import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a string to be used as a Firebase Realtime Database key.
 * Replaces illegal characters ('.', '#', '$', '/', '[', ']') with a hyphen.
 * @param key The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeFirebaseKey(key: string): string {
  if (typeof key !== 'string') return '';
  return key.replace(/[.#$\[\]/]/g, '-');
}

const khmerToLatinMap: { [key: string]: string } = {
  '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4',
  '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9'
};

/**
 * Normalizes Khmer digits (០-៩) in a string to standard Latin digits (0-9).
 * @param val The value to normalize.
 * @returns The normalized string.
 */
export function normalizeToLatin(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.replace(/[០-៩]/g, (match) => khmerToLatinMap[match] || match);
}
