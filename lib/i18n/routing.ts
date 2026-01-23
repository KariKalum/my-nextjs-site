/**
 * Routing helpers for locale-aware links
 */

import { type Locale, defaultLocale } from './config'

/**
 * Get locale from pathname (client-side)
 * Example: "/de/cities" -> "de"
 */
export function getLocaleFromPathname(pathname: string | null): Locale {
  if (!pathname) return defaultLocale
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  if (firstSegment === 'en' || firstSegment === 'de') {
    return firstSegment
  }
  return defaultLocale
}

/**
 * Prefix a path with locale
 * Example: prefixWithLocale("/cities", "de") -> "/de/cities"
 */
export function prefixWithLocale(path: string, locale: Locale): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `/${locale}${cleanPath ? `/${cleanPath}` : ''}`
}
