/**
 * Data fetching utilities for city/district pages
 */

import { createClient } from '@/src/lib/supabase/server'
import type { Cafe } from '@/src/lib/supabase/types'
import { filterCafesByIntent, type Intent } from './intent'

/**
 * Get cafes by city name (case-insensitive)
 */
export async function getCafesByCity(cityName: string): Promise<Cafe[]> {
  // Runtime guard: ensure cityName is valid
  if (!cityName || typeof cityName !== 'string' || cityName.trim().length === 0) {
    console.warn('getCafesByCity: Invalid cityName provided')
    return []
  }

  try {
    const supabase = await createClient()

    // Fetch all active cafes
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .or('is_active.is.null,is_active.eq.true')
      .order('work_score', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching cafes by city:', error)
      return []
    }

    // Runtime guard: ensure data is an array
    if (!Array.isArray(data)) {
      console.warn('getCafesByCity: Data is not an array')
      return []
    }

    // Filter by city name (case-insensitive)
    const filtered = data.filter((cafe) => {
      if (!cafe || typeof cafe !== 'object') return false
      return cafe.city?.toLowerCase() === cityName.toLowerCase()
    }) as Cafe[]

    return filtered
  } catch (error) {
    console.error('Error fetching cafes by city:', error)
    return []
  }
}

/**
 * Get cafes by city and optionally filter by district and/or intent.
 * District filtering is done via address matching (case-insensitive).
 * Intent filtering is applied after city+district (work / laptop-friendly).
 * When district and intent are not provided, behavior is unchanged for existing pages.
 */
export async function getCafesByCityAndDistrict(
  cityName: string,
  districtName?: string,
  intent?: Intent
): Promise<Cafe[]> {
  // Runtime guard: ensure cityName is valid
  if (!cityName || typeof cityName !== 'string' || cityName.trim().length === 0) {
    console.warn('getCafesByCityAndDistrict: Invalid cityName provided')
    return []
  }

  const cafes = await getCafesByCity(cityName)

  // Runtime guard: ensure cafes is an array
  if (!Array.isArray(cafes)) {
    console.warn('getCafesByCityAndDistrict: getCafesByCity did not return an array')
    return []
  }

  let result = cafes

  // If district specified, filter by district name in address (case-insensitive)
  if (districtName && typeof districtName === 'string' && districtName.trim().length > 0) {
    const districtLower = districtName.toLowerCase()
    const searchTerms = [districtLower]
    if (districtLower === 'hauptbahnhof') {
      searchTerms.push('hbf', 'hauptbahnhof')
    } else if (districtLower === 'hbf') {
      searchTerms.push('hauptbahnhof', 'hbf')
    }

    result = result.filter((cafe) => {
      if (!cafe || typeof cafe !== 'object') return false
      if (!cafe.address || typeof cafe.address !== 'string') return false
      const addressLower = cafe.address.toLowerCase()
      return searchTerms.some(
        (term) =>
          addressLower.includes(term) ||
          addressLower.includes(`berlin-${term}`) ||
          addressLower.includes(`${term},`) ||
          addressLower.includes(` ${term} `) ||
          addressLower.endsWith(` ${term}`)
      )
    })
  }

  return filterCafesByIntent(result, intent)
}

/**
 * Map district slug to display name for filtering
 * Handles common variations and special cases
 */
export function getDistrictDisplayName(slug: string): string {
  const districtMap: Record<string, string> = {
    'mitte': 'Mitte',
    'kreuzberg': 'Kreuzberg',
    'charlottenburg': 'Charlottenburg',
    'neukoelln': 'Neukölln',
    'neukolln': 'Neukölln',
    'prenzlauer-berg': 'Prenzlauer Berg',
    'prenzlauerberg': 'Prenzlauer Berg',
    'friedrichshain': 'Friedrichshain',
    'hbf': 'Hauptbahnhof',
  }

  const lowerSlug = slug.toLowerCase()
  if (districtMap[lowerSlug]) {
    return districtMap[lowerSlug]
  }

  // Fallback: Convert slug to display name
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
