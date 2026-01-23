/**
 * City name normalization and slug generation utilities
 */

/**
 * Normalize German characters and create URL-friendly slug from city name
 * Examples:
 *   "Frankfurt am Main" -> "frankfurt-am-main"
 *   "München" -> "muenchen"
 *   "Köln" -> "koeln"
 */
export function slugifyCity(name: string): string {
  if (!name || typeof name !== 'string') {
    return ''
  }

  return name
    .trim()
    .toLowerCase()
    // Normalize German characters
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ä/g, 'a')
    .replace(/ß/g, 'ss')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove punctuation (keep hyphens)
    .replace(/[^\w-]/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
}

/**
 * Log once per key to avoid spam in dev/server logs
 * Uses a simple in-memory cache (cleared on server restart)
 */
const loggedKeys = new Set<string>()

export function logOnce(key: string, ...args: unknown[]): void {
  if (!loggedKeys.has(key)) {
    loggedKeys.add(key)
    console.log(`[${key}]`, ...args)
  }
}
