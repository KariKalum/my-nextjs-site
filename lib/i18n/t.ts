/**
 * Simple nested key resolver with fallback to English
 * Usage: t(dict, 'home.hero.title') -> string
 * If key missing in dict, returns en value; if missing in both, returns key
 */

import en from './dictionaries/en.json'

type Dict = Record<string, unknown>

function get(obj: Dict, path: string): unknown {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

/**
 * Translate key. Falls back to English if missing in locale dict.
 * @param dict - locale dictionary from getDictionary
 * @param key - dotted path e.g. 'home.hero.title'
 * @returns translated string, or key if not found
 */
export function t(dict: Dict, key: string): string {
  const v = get(dict, key)
  if (typeof v === 'string') return v
  const fallback = get(en as Dict, key)
  if (typeof fallback === 'string') return fallback
  return key
}

/**
 * Replace {key} placeholders in a string with values from vars.
 * Use for metadata templates, e.g. tmpl(t(dict, 'meta.city.title'), { city: 'Berlin', siteName: 'Café Directory' })
 */
export function tmpl(
  s: string,
  vars: Record<string, string | number | undefined>
): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}
