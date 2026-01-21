/**
 * Validates that a URL is not a localhost/127.0.0.1 URL
 * @param urlString - The URL string to validate
 * @returns true if URL is valid and not localhost, false otherwise
 */
export function isValidPublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    // Reject localhost and 127.x.x.x URLs
    if (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname.startsWith('127.')
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Validates and sanitizes a URL, returning null if it's localhost or invalid
 * @param urlString - The URL string to validate
 * @returns The URL if valid and public, null otherwise
 */
export function sanitizeUrl(urlString: string | null | undefined): string | null {
  if (!urlString || !urlString.trim()) {
    return null
  }
  return isValidPublicUrl(urlString.trim()) ? urlString.trim() : null
}
