'use client'

import type { Cafe } from '@/src/lib/supabase/types'
import { getAbsoluteUrl } from '@/lib/seo/metadata'

interface CafeStructuredDataProps {
  cafe: Cafe
  cafeUrl: string
}

export default function CafeStructuredData({ cafe, cafeUrl }: CafeStructuredDataProps) {
  // Build address object
  const address: any = {
    '@type': 'PostalAddress',
    streetAddress: cafe.address || '',
    addressLocality: cafe.city || '',
    addressRegion: cafe.state || null,
    postalCode: cafe.zip_code || null,
    addressCountry: cafe.country || 'DE',
  }

  // Remove null values
  Object.keys(address).forEach(key => {
    if (address[key] === null || address[key] === '') {
      delete address[key]
    }
  })

  // Build geo coordinates
  const geo = cafe.latitude && cafe.longitude ? {
    '@type': 'GeoCoordinates',
    latitude: cafe.latitude,
    longitude: cafe.longitude,
  } : undefined

  // Parse opening hours from hours object
  const openingHoursSpecification: any[] = []
  if (cafe.hours && typeof cafe.hours === 'object') {
    const dayMap: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    }

    Object.entries(cafe.hours).forEach(([day, hours]) => {
      if (hours && typeof hours === 'string') {
        // Try to parse hours like "7:00 AM - 8:00 PM"
        const match = hours.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
        if (match) {
          openingHoursSpecification.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: `https://schema.org/${dayMap[day] || day}`,
            opens: match[1],
            closes: match[2],
          })
        }
      }
    })
  }

  // Build price range from price_level
  const priceRange = cafe.price_level 
    ? `${'$'.repeat(Math.min(cafe.price_level, 4))}` 
    : undefined

  // Build aggregate rating
  const aggregateRating = cafe.google_rating && cafe.google_ratings_total 
    ? {
        '@type': 'AggregateRating',
        ratingValue: cafe.google_rating,
        reviewCount: cafe.google_ratings_total,
        bestRating: '5',
        worstRating: '1',
      }
    : undefined

  // Build sameAs array
  const sameAs: string[] = []
  if (cafe.google_maps_url) sameAs.push(cafe.google_maps_url)
  if (cafe.website) sameAs.push(cafe.website)

  // Build reviews from google_reviews if available
  const reviews: any[] = []
  if (cafe.google_reviews && Array.isArray(cafe.google_reviews)) {
    cafe.google_reviews.slice(0, 3).forEach((review: any) => {
      if (review) {
        const reviewObj: any = {
          '@type': 'Review',
          reviewBody: typeof review.text === 'string' 
            ? review.text.substring(0, 500) 
            : review.reviewBody || '',
        }

        if (review.rating) {
          reviewObj.reviewRating = {
            '@type': 'Rating',
            ratingValue: review.rating,
            bestRating: '5',
            worstRating: '1',
          }
        }

        if (review.author_name) {
          reviewObj.author = {
            '@type': 'Person',
            name: review.author_name,
          }
        }

        if (review.time) {
          reviewObj.datePublished = new Date(review.time * 1000).toISOString()
        }

        // Only add if we have at least reviewBody
        if (reviewObj.reviewBody) {
          reviews.push(reviewObj)
        }
      }
    })
  }

  // Build main structured data object
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: cafe.name,
    description: cafe.description || undefined,
    url: cafeUrl,
    telephone: cafe.phone || undefined,
    email: cafe.email || undefined,
    address,
    geo,
    openingHoursSpecification: openingHoursSpecification.length > 0 
      ? openingHoursSpecification 
      : undefined,
    priceRange,
    aggregateRating,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    review: reviews.length > 0 ? reviews : undefined,
  }

  // Remove undefined values
  Object.keys(structuredData).forEach(key => {
    if (structuredData[key] === undefined) {
      delete structuredData[key]
    }
  })

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
