/**
 * Sanitization utilities to prevent XSS attacks on free-text inputs.
 *
 * Applied at the data layer (hooks/mutations) so every write path is covered
 * regardless of which UI component originates the data.
 */

// Characters that could be used for HTML/script injection
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

const ENTITY_REGEX = /[&<>"'`/]/g;

/**
 * Escapes HTML special characters to prevent XSS.
 * Safe for storing in the database — preserves readability when displayed as text.
 */
export function escapeHtml(input: string): string {
  return input.replace(ENTITY_REGEX, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strips all HTML tags from a string (more aggressive than escaping).
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes a single text value: trims whitespace, strips HTML tags,
 * then escapes remaining special characters.
 * Returns null/undefined as-is for nullable database fields.
 */
export function sanitizeText(value: string | null | undefined): string | null | undefined {
  if (value == null) return value;
  if (typeof value !== 'string') return value;
  return escapeHtml(stripHtml(value.trim()));
}

/**
 * Sanitizes all string values in an object (shallow, one level).
 * Non-string values are passed through unchanged.
 * Useful for sanitizing entire form payloads before database writes.
 *
 * @param obj - Object with string fields to sanitize
 * @param fields - Optional list of field names to sanitize. If omitted, all string fields are sanitized.
 */
export function sanitizeFields<T extends Record<string, unknown>>(
  obj: T,
  fields?: (keyof T)[]
): T {
  const result = { ...obj };
  const keys = fields ?? (Object.keys(result) as (keyof T)[]);

  for (const key of keys) {
    const value = result[key];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key as string] = sanitizeText(value) as string;
    }
  }

  return result;
}

/**
 * List of common free-text field names that should always be sanitized.
 * Used as a reference for which fields to target in mutation hooks.
 */
export const TEXT_FIELDS_TO_SANITIZE = [
  'description',
  'notes',
  'terms',
  'cancellation_reason',
  'rejection_reason',
  'damages',
  'service_provider',
  'name',
  'company_name',
  'full_name',
] as const;
