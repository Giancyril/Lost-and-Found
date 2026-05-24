import DOMPurify from 'dompurify';

/**
 * Sanitizes input text to prevent XSS attacks.
 * @param input The raw input string from the user.
 * @returns The sanitized string safe for rendering or sending to the backend.
 */
export const sanitizeInput = (input: string | undefined | null): string => {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags since we only expect plain text from forms
    ALLOWED_ATTR: [],
  }).trim();
};

/**
 * Recursively sanitizes all string values within an object.
 * @param obj The object containing potential string inputs.
 * @returns A new object with all string values sanitized.
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (value && typeof value === 'object' && !(value instanceof File) && !(value instanceof Date)) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as T;
};
