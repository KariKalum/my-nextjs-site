/**
 * Server-safe dictionary loader for i18n
 * Uses static imports (no fs) so it works in RSC, Edge, and Node
 */

import type { Locale } from './config'
import en from './dictionaries/en.json'
import de from './dictionaries/de.json'

const dictionaries = { en, de } as const
export type Dictionary = (typeof dictionaries)['en']

export function getDictionary(locale: Locale): Dictionary {
  const d = dictionaries[locale]
  return d ?? dictionaries.en
}
