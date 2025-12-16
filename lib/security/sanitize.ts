import sanitizeHtmlLib from 'sanitize-html'

/**
 * Sanitize HTML dari user input untuk mencegah XSS attacks
 */

/**
 * Default sanitization options - strip all HTML
 */
const strictOptions: sanitizeHtmlLib.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
}

/**
 * Options untuk comment text - allow safe formatting tags
 */
const commentOptions: sanitizeHtmlLib.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p'],
  allowedAttributes: {},
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
}

/**
 * Sanitize text input (remove all HTML)
 * Use untuk: guest names, usernames, titles, dll
 */
export function sanitizeText(input: string): string {
  if (!input) return ''
  return sanitizeHtmlLib(input, strictOptions).trim()
}

/**
 * Sanitize HTML - alias for sanitizeText
 */
export function sanitizeHtml(input: string): string {
  return sanitizeText(input)
}

/**
 * Sanitize comment text (allow safe formatting)
 * Use untuk: comments, messages yang allow basic formatting
 */
export function sanitizeComment(input: string): string {
  if (!input) return ''
  return sanitizeHtmlLib(input, commentOptions).trim()
}

/**
 * Sanitize email address
 * Remove HTML dan validate format basic
 */
export function sanitizeEmail(input: string): string {
  if (!input) return ''
  const cleaned = sanitizeHtmlLib(input, strictOptions).trim().toLowerCase()
  return cleaned
}

/**
 * Sanitize user input object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: { allowHtml?: boolean } = {}
): T {
  const sanitized = {} as T

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = (
        options.allowHtml ? sanitizeComment(value) : sanitizeText(value)
      ) as T[keyof T]
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value, options) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }

  return sanitized
}

/**
 * Strip HTML tags completely (more aggressive than sanitize)
 */
export function stripHtml(input: string): string {
  if (!input) return ''
  return input.replace(/<[^>]*>/g, '').trim()
}

/**
 * Escape HTML entities untuk safe display
 */
export function escapeHtml(input: string): string {
  if (!input) return ''
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return input.replace(/[&<>"'/]/g, (char) => map[char])
}

/**
 * Validate dan sanitize filename
 * Remove path traversal characters dan dangerous patterns
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return ''
  
  // Remove path traversal
  let clean = filename.replace(/\.\./g, '')
  
  // Remove path separators
  clean = clean.replace(/[/\\]/g, '')
  
  // Keep only safe characters: alphanumeric, dash, underscore, dot
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_')
  
  // Remove leading dots
  clean = clean.replace(/^\.+/, '')
  
  return clean.trim()
}

/**
 * Validate slug format
 * Only allow lowercase letters, numbers, and hyphens
 */
export function sanitizeSlug(slug: string): string {
  if (!slug) return ''
  
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
