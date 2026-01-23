/**
 * Locale configuration
 * Whitelist of supported locales
 */

export const locales = ['en', 'de'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'de' // Germany primary

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

/**
 * Get locale from app/[locale] route params
 */
export function getLocaleFromParams(params: { locale: string }): Locale {
  return isValidLocale(params.locale) ? params.locale : defaultLocale
}
