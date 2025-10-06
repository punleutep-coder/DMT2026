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
