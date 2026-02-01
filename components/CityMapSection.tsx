'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Cafe } from '@/src/lib/supabase/types'
import NearbyCafesMap, { type CafeForMap, type MapBounds } from './NearbyCafesMap'
import CafeCard from './CafeCard'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { Locale } from '@/lib/i18n/config'

interface CityMapSectionProps {
  cafes: Cafe[]
  locale: Locale
  dict: Dictionary
  cityName: string
  /** Pre-defined map center for the region (used even if no cafes) */
  regionCenter?: { lat: number; lng: number }
  /** Map zoom level (higher = more zoomed in; districts typically 14, city 12) */
  regionZoom?: number
  /** When true, keep district center and zoom instead of fitting bounds to markers */
  preserveRegionZoom?: boolean
}

const INITIAL_DISPLAY_COUNT = 8

/** Check if a cafe is within the given bounds */
function isWithinBounds(cafe: Cafe, bounds: MapBounds): boolean {
  if (cafe.latitude == null || cafe.longitude == null) return false
  return (
    cafe.latitude >= bounds.south &&
    cafe.latitude <= bounds.north &&
    cafe.longitude >= bounds.west &&
    cafe.longitude <= bounds.east
  )
}

export default function CityMapSection({ cafes, locale, dict, cityName, regionCenter, regionZoom = 12, preserveRegionZoom = false }: CityMapSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const [visibleBounds, setVisibleBounds] = useState<MapBounds | null>(null)

  // Filter cafes with valid coordinates for the map
  const cafesWithCoords = useMemo(() => 
    cafes.filter((cafe) => cafe.latitude != null && cafe.longitude != null),
    [cafes]
  )

  // Use region center if provided, otherwise calculate from cafes
  const mapCenter = useMemo(() => {
    // If we have a predefined region center, always use it
    if (regionCenter) {
      return regionCenter
    }

    // Fall back to calculating from cafes
    if (cafesWithCoords.length === 0) {
      // Default to Berlin center if no cafes and no region center
      return { lat: 52.52, lng: 13.405 }
    }

    const totalLat = cafesWithCoords.reduce((sum, cafe) => sum + (cafe.latitude ?? 0), 0)
    const totalLng = cafesWithCoords.reduce((sum, cafe) => sum + (cafe.longitude ?? 0), 0)

    return {
      lat: totalLat / cafesWithCoords.length,
      lng: totalLng / cafesWithCoords.length,
    }
  }, [cafesWithCoords, regionCenter])

  // Convert Cafe[] to CafeForMap[] for the map component
  const cafesForMap: CafeForMap[] = useMemo(() => 
    cafesWithCoords.map((cafe) => ({
      id: cafe.id,
      place_id: cafe.place_id,
      name: cafe.name,
      lat: cafe.latitude!,
      lng: cafe.longitude!,
      wifi: cafe.ai_wifi_quality ? { available: true } : undefined,
      outlets: cafe.ai_power_outlets ? { available: true } : undefined,
      noise: cafe.ai_noise_level,
      rating: cafe.google_rating,
      city: cafe.city,
    })),
    [cafesWithCoords]
  )

  // Handle bounds change from map (for dynamic card filtering)
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    if (preserveRegionZoom) {
      setVisibleBounds(bounds)
    }
  }, [preserveRegionZoom])

  // For district pages (preserveRegionZoom), filter cafes to those visible in map bounds
  // For city pages, show all cafes
  const visibleCafes = useMemo(() => {
    if (preserveRegionZoom && visibleBounds) {
      return cafesWithCoords.filter((cafe) => isWithinBounds(cafe, visibleBounds))
    }
    return cafesWithCoords
  }, [cafesWithCoords, preserveRegionZoom, visibleBounds])

  // Use visible cafes for cards
  const displayedCafes = showAll ? visibleCafes : visibleCafes.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMore = visibleCafes.length > INITIAL_DISPLAY_COUNT
  const cafeCount = visibleCafes.length

  // Show map if we have cafes with coordinates OR a predefined region center
  const showMap = cafesForMap.length > 0 || regionCenter

  return (
    <section className="mb-12 space-y-6">
      {/* Map - show even with 0 cafes if we have a region center */}
      {showMap && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            📍 {cityName} {t(dict, 'city.cafesOnMap')}
          </h2>
          <NearbyCafesMap
            center={mapCenter}
            cafes={cafesForMap}
            className="h-64 md:h-96"
            zoom={regionZoom}
            preserveRegionZoom={preserveRegionZoom}
            onBoundsChange={handleBoundsChange}
          />
        </div>
      )}

      {/* Cafe Cards - same cafes as shown on the map */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          ☕ {cafeCount} {cafeCount === 1 ? t(dict, 'common.cafeFound') : t(dict, 'common.cafesFound')}
        </h2>
        
        {cafeCount === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">{t(dict, 'searchResults.noCafesFound')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {displayedCafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} locale={locale} dict={dict} />
              ))}
            </div>

            {/* Show More Button */}
            {hasMore && !showAll && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-primary-400 hover:text-primary-600 transition-colors shadow-sm"
                >
                  {t(dict, 'common.showMore')} ({visibleCafes.length - INITIAL_DISPLAY_COUNT} {t(dict, 'common.more')})
                </button>
              </div>
            )}

            {/* Show Less Button (when expanded) */}
            {showAll && hasMore && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-primary-400 hover:text-primary-600 transition-colors shadow-sm"
                >
                  {t(dict, 'common.showLess')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
