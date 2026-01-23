/**
 * Server-side functions for fetching city data with café counts
 * Uses cafes table + major_cities table (no dependency on cities table)
 */

import { createClient } from '@/src/lib/supabase/server'
import { slugifyCity, logOnce } from '@/lib/utils/city-helpers'

export interface CityWithCount {
  id: string
  name: string
  slug: string
  image_url: string | null
  is_major: boolean
  display_order: number
  cafe_count: number
}

export interface TopCity {
  city: string
  count: number
}

export interface TopCityWithImage {
  name: string
  slug: string
  cafeCount: number
  imageUrl: string
}

/**
 * Fetch major cities with café counts
 * @deprecated This function uses the cities table which doesn't exist.
 * Use getTopCitiesWithImages instead.
 */
export async function getMajorCitiesWithCounts(): Promise<CityWithCount[]> {
  // Return empty array - cities table doesn't exist
  logOnce('getMajorCitiesWithCounts-deprecated', 'getMajorCitiesWithCounts is deprecated, use getTopCitiesWithImages')
  return []
}

/**
 * Fetch top N cities by café count
 * Returns cities ordered by number of cafés (descending)
 * @deprecated Use getTopCitiesWithImages instead
 */
export async function getTopCitiesByCount(limit: number = 10): Promise<TopCity[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cafes')
    .select('city')
    .or('is_active.is.null,is_active.eq.true')

  if (error) {
    logOnce('top-cities-error', 'Error fetching cafes for top cities:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Count cafés per city
  const cityCounts = new Map<string, number>()
  data.forEach((cafe) => {
    if (cafe.city) {
      cityCounts.set(cafe.city, (cityCounts.get(cafe.city) || 0) + 1)
    }
  })

  // Convert to array, sort by count (desc), then by name (asc) for ties
  return Array.from(cityCounts.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.city.localeCompare(b.city)
    })
    .slice(0, limit)
}

/**
 * Fetch top N cities by café count with images from major_cities table
 * Returns cities ordered by café count (descending) with image URLs
 * 
 * Implementation:
 * 1. Query cafes table to get top cities by count
 * 2. Generate slugs for each city name
 * 3. Query major_cities table to fetch matching image_urls by slug
 * 4. Merge results with fallback image if no match found
 */
export async function getTopCitiesWithImages(
  limit: number = 5
): Promise<TopCityWithImage[]> {
  const supabase = await createClient()
  const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'

  try {
    // Query 1: Get top cities from cafes table
    const { data: cafes, error: cafesError } = await supabase
      .from('cafes')
      .select('city')
      .or('is_active.is.null,is_active.eq.true')
      .not('city', 'is', null)

    if (cafesError) {
      logOnce('top-cities-query-error', 'Error fetching cafes:', cafesError)
      return []
    }

    if (!cafes || cafes.length === 0) {
      return []
    }

    // Count cafés per city
    const cityCounts = new Map<string, number>()
    cafes.forEach((cafe) => {
      if (cafe.city && cafe.city.trim()) {
        const cityName = cafe.city.trim()
        cityCounts.set(cityName, (cityCounts.get(cityName) || 0) + 1)
      }
    })

    // Get top N cities sorted by count
    const topCities = Array.from(cityCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.name.localeCompare(b.name)
      })
      .slice(0, limit)

    if (topCities.length === 0) {
      return []
    }

    // Query 2: Fetch matching rows from major_cities by slug
    const slugs = topCities.map((city) => slugifyCity(city.name))
    const { data: majorCities, error: majorCitiesError } = await supabase
      .from('major_cities')
      .select('slug, image_url, name')
      .in('slug', slugs)

    if (majorCitiesError) {
      logOnce('major-cities-images-error', 'Error fetching major_cities:', majorCitiesError)
      // Continue with fallback images
    }

    // Create a map of slug -> image_url for quick lookup
    const imageMap = new Map<string, string>()
    if (majorCities) {
      majorCities.forEach((mc) => {
        if (mc.slug && mc.image_url) {
          imageMap.set(mc.slug, mc.image_url)
        }
      })
    }

    // Merge results: output ordered by cafeCount desc, attach imageUrl from major_cities or fallback
    return topCities.map((city) => {
      const slug = slugifyCity(city.name)
      const imageUrl = imageMap.get(slug) || FALLBACK_IMAGE_URL

      return {
        name: city.name,
        slug,
        cafeCount: city.count,
        imageUrl,
      }
    })
  } catch (err) {
    logOnce('top-cities-with-images-error', 'Unexpected error:', err)
    return []
  }
}
