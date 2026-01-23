/**
 * Path helpers for locale-aware routing
 */

import { type Locale, defaultLocale, isValidLocale } from './config'

/**
 * Strip locale prefix from a pathname
 * Example: "/de/cities/berlin" -> "/cities/berlin"
 * Example: "/en" -> "/"
 */
export function stripLocale(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  
  // If first segment is a valid locale, remove it
  if (isValidLocale(firstSegment)) {
    const pathWithoutLocale = '/' + segments.slice(1).join('/')
    return pathWithoutLocale === '/' ? '/' : pathWithoutLocale
  }
  
  return pathname
}

/**
 * Add locale prefix to a path
 * Example: withLocale("de", "/cities/berlin") -> "/de/cities/berlin"
 * Example: withLocale("de", "/") -> "/de"
 * Example: withLocale("de", "cities") -> "/de/cities"
 */
export function withLocale(locale: Locale, path: string): string {
  // Normalize path: ensure it starts with / and remove any existing locale
  let cleanPath = stripLocale(path)
  
  // If path is just "/", return "/{locale}"
  if (cleanPath === '/') {
    return `/${locale}`
  }
  
  // Ensure path starts with /
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath
  }
  
  return `/${locale}${cleanPath}`
}

/**
 * Switch locale while preserving the current path structure
 * Example: switchLocale("/de/cities/berlin", "en") -> "/en/cities/berlin"
 * Example: switchLocale("/de", "en") -> "/en"
 */
export function switchLocale(pathname: string, targetLocale: Locale): string {
  const pathWithoutLocale = stripLocale(pathname)
  return withLocale(targetLocale, pathWithoutLocale)
}
