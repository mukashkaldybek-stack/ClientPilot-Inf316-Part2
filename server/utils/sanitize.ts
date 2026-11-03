/**
 * Sanitizes input text to prevent XSS and formatting breakages
 * by encoding HTML entities (&, <, >, ", ') while preserving
 * valid UTF-8 international characters (é, ñ, ü, ø, etc.).
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

