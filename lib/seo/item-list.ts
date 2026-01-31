/**
 * Build schema.org ItemList JSON-LD for city/district list pages.
 * Used by CityPageTemplate for /cities/[city], /cities/[city]/work, /cities/[city]/laptop-friendly,
 * /cities/berlin/[district], /cities/berlin/[district]/work.
 */

import { getCafeHref } from '@/lib/cafeRouting'
import { getAbsoluteUrl } from './metadata'

/** Cafe-like shape with fields needed for ItemList (no image URL in list data). */
type CafeForList = {
  id?: string
  place_id?: string | null
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  latitude?: number | null
  longitude?: number | null
  google_rating?: number | null
  google_ratings_total?: number | null
}

const MAX_ITEMLIST_ITEMS = 50

/**
 * Build ItemList JSON-LD for the cafes displayed on a list page.
 * Caps at MAX_ITEMLIST_ITEMS. Uses absolute URLs with correct locale.
 */
export function buildCityPageItemList(
  cafes: CafeForList[],
  locale: string,
  pageAbsoluteUrl: string
): Record<string, unknown> {
  const list = Array.isArray(cafes) ? cafes.slice(0, MAX_ITEMLIST_ITEMS) : []

  const itemListElement = list.map((cafe, index) => {
    const href = getCafeHref(cafe, locale)
    const url = getAbsoluteUrl(href)

    const item: Record<string, unknown> = {
      '@type': 'CafeOrCoffeeShop',
      name: cafe.name ?? 'Café',
      url,
    }

    if (
      typeof cafe.google_rating === 'number' &&
      typeof cafe.google_ratings_total === 'number' &&
      cafe.google_ratings_total >= 0
    ) {
      item.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: cafe.google_rating,
        reviewCount: cafe.google_ratings_total,
      }
    }

    if (cafe.address || cafe.city || cafe.state) {
      const address: Record<string, string> = { '@type': 'PostalAddress' }
      if (cafe.address) address.streetAddress = cafe.address
      if (cafe.city) address.addressLocality = cafe.city
      if (cafe.state) address.addressRegion = cafe.state
      item.address = address
    }

    if (
      typeof cafe.latitude === 'number' &&
      typeof cafe.longitude === 'number' &&
      !Number.isNaN(cafe.latitude) &&
      !Number.isNaN(cafe.longitude)
    ) {
      item.geo = {
        '@type': 'GeoCoordinates',
        latitude: cafe.latitude,
        longitude: cafe.longitude,
      }
    }

    return {
      '@type': 'ListItem',
      position: index + 1,
      item,
    }
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${pageAbsoluteUrl}#itemlist`,
    numberOfItems: list.length,
    itemListElement,
  }
}
