/**
 * Client-safe city search: normalized matching and slug lookup.
 * No dependency on city-config so Hero (client) can use it.
 */

import { normalizeForSearch as normalizeForSearchImpl } from './city-helpers'

/** Re-export for Hero; lowercases + folds umlauts (ü→u, ö→o, ä→a, ß→ss) */
export const normalizeForSearch = normalizeForSearchImpl

/** Normalized query -> DB city names to search; e.g. "dusseldorf" -> ["Düsseldorf"] */
const NORMALIZED_TO_NAMES: Record<string, string[]> = {
  dusseldorf: ['Düsseldorf'],
  duesseldorf: ['Düsseldorf'],
  koln: ['Köln', 'Cologne'],
  koeln: ['Köln', 'Cologne'],
  cologne: ['Köln', 'Cologne'],
  munchen: ['München', 'Munich'],
  munich: ['München', 'Munich'],
  muenchen: ['München', 'Munich'],
  nurnberg: ['Nürnberg', 'Nuremberg'],
  nuremberg: ['Nürnberg', 'Nuremberg'],
  nuernberg: ['Nürnberg', 'Nuremberg'],
  osnabruck: ['Osnabrück'],
  osnabrueck: ['Osnabrück'],
}

/** DB/display city name -> canonical URL slug */
const CITY_NAME_TO_SLUG: Record<string, string> = {
  Berlin: 'berlin',
  Hamburg: 'hamburg',
  Munich: 'muenchen',
  München: 'muenchen',
  Cologne: 'koeln',
  Köln: 'koeln',
  Frankfurt: 'frankfurt',
  Leipzig: 'leipzig',
  Düsseldorf: 'duesseldorf',
  Dresden: 'dresden',
  'Nürnberg': 'nuernberg',
  Nuremberg: 'nuernberg',
  Hannover: 'hannover',
  Stuttgart: 'stuttgart',
  Bremen: 'bremen',
  Osnabrück: 'osnabrueck',
  Potsdam: 'potsdam',
}

/**
 * Returns DB city names to search when user types a query (e.g. "dusseldorf" -> ["Düsseldorf"]).
 */
export function getCityNamesForSearch(query: string): string[] {
  if (!query || typeof query !== 'string') return []
  const key = normalizeForSearchImpl(query)
  return NORMALIZED_TO_NAMES[key] ?? []
}

/**
 * Canonical slug for city page from DB/display name. Fallback: slugify the name.
 */
export function getSlugForCityFromName(cityName: string): string {
  if (!cityName || typeof cityName !== 'string') return ''
  const slug = CITY_NAME_TO_SLUG[cityName]
  if (slug) return slug
  return normalizeForSearchImpl(cityName).replace(/\s+/g, '-')
}

/**
 * Returns true if the DB city name matches the search query (normalized).
 */
export function cityMatchesSearch(cityName: string, query: string): boolean {
  if (!query.trim() || !cityName) return false
  const nq = normalizeForSearchImpl(query)
  const nc = normalizeForSearchImpl(cityName)
  return nc.includes(nq) || nq.includes(nc)
}
