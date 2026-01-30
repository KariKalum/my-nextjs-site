'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import type { Cafe } from '@/src/lib/supabase/types'
import CafeCard from '@/components/CafeCard'
import { getCafeHref } from '@/lib/cafeRouting'
import { prefixWithLocale } from '@/lib/i18n/routing'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { Locale } from '@/lib/i18n/config'
import { BERLIN_CENTER, RADIUS_STEPS, MIN_RESULTS_THRESHOLD, DEFAULT_RADIUS_M } from '@/lib/location-constants'

/** Feature config: slug -> icon, H1 key, short description key, label key (for "Showing cafés with X") */
const FEATURE_ICONS: Record<string, string> = {
  wifi: '📶',
  outlets: '🔌',
  quiet: '🔇',
  'time-limit': '⏰',
}

const FEATURE_H1_KEYS: Record<string, string> = {
  wifi: 'find.h1Wifi',
  outlets: 'find.h1Outlets',
  quiet: 'find.h1Quiet',
  'time-limit': 'find.h1TimeLimit',
}

const FEATURE_DESCRIPTION_KEYS: Record<string, string> = {
  wifi: 'find.descriptionWifi',
  outlets: 'find.descriptionOutlets',
  quiet: 'find.descriptionQuiet',
  'time-limit': 'find.descriptionTimeLimit',
}

const FEATURE_LABEL_KEYS: Record<string, string> = {
  wifi: 'find.wifiLabel',
  outlets: 'find.outletsLabel',
  quiet: 'find.quietLabel',
  'time-limit': 'find.timeLimitLabel',
}

const FEATURE_NEAR_ME_KEYS: Record<string, string> = {
  wifi: 'find.nearMeWifi',
  outlets: 'find.nearMeOutlets',
  quiet: 'find.nearMeQuiet',
  'time-limit': 'find.nearMeTimeLimit',
}

const FEATURE_SLUGS = ['wifi', 'outlets', 'quiet', 'time-limit'] as const
const RELATED_CITY_SLUGS = ['berlin', 'munich', 'hamburg', 'cologne', 'frankfurt'] as const
const INITIAL_CARDS = 8
const SHOW_MORE_STEP = 8

type CafeWithDistance = Cafe & {
  distance?: number
}

type FeaturePageTemplateProps = {
  feature: string
  dict: Dictionary
  locale: Locale
}

export default function FeaturePageTemplate({ feature, dict, locale }: FeaturePageTemplateProps) {
  const h1Key = FEATURE_H1_KEYS[feature]
  const descriptionKey = FEATURE_DESCRIPTION_KEYS[feature]
  const labelKey = FEATURE_LABEL_KEYS[feature]
  const icon = FEATURE_ICONS[feature]
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([])

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle')
  const isRequestingLocation = locationStatus === 'requesting'
  const [manualCity, setManualCity] = useState('')
  const [cafes, setCafes] = useState<CafeWithDistance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapStatus, setMapStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [radius, setRadius] = useState(DEFAULT_RADIUS_M as number)
  const [visibleCount, setVisibleCount] = useState(INITIAL_CARDS)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Load Google Maps script
  const loadGoogleMaps = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (window.google?.maps) return

    if (!apiKey) {
      setMapStatus('error')
      return
    }

    return new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')))
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Maps'))
      document.head.appendChild(script)
    })
  }, [apiKey])

  // Initialize map
  const initMap = useCallback((center: { lat: number; lng: number }) => {
    if (!mapRef.current || !window.google?.maps) return

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
    })
    mapInstanceRef.current = map
    setMapStatus('ready')
  }, [])

  const placeMarkers = useCallback((map: google.maps.Map, cafesList: CafeWithDistance[]) => {
    markersRef.current.forEach((m) => m.setMap(null))
    infoWindowsRef.current.forEach((iw) => iw.close())
    markersRef.current = []
    infoWindowsRef.current = []

    if (cafesList.length === 0) return

    const bounds = new google.maps.LatLngBounds()
    const kmAway = t(dict, 'find.kmAway')
    const viewDetailsLink = t(dict, 'find.viewDetailsLink')

    cafesList.forEach((cafe) => {
      if (cafe.latitude == null || cafe.longitude == null) return
      const position = new google.maps.LatLng(cafe.latitude, cafe.longitude)
      bounds.extend(position)

      const marker = new google.maps.Marker({
        position,
        map,
        title: cafe.name,
        animation: google.maps.Animation.DROP,
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: system-ui, sans-serif; padding: 12px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
              ${escapeHtml(cafe.name)}
            </h3>
            ${cafe.distance ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">${(cafe.distance / 1000).toFixed(2)} ${escapeHtml(kmAway)}</p>` : ''}
            <a 
              href="${escapeHtml(getCafeHref(cafe, locale))}" 
              style="display: inline-block; margin-top: 8px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #ffffff; background-color: #2563eb; border-radius: 6px; text-decoration: none;"
            >
              ${escapeHtml(viewDetailsLink)}
            </a>
          </div>
        `,
        maxWidth: 300,
      })

      marker.addListener('click', () => {
        infoWindowsRef.current.forEach((iw) => iw.close())
        infoWindow.open(map, marker)
      })

      markersRef.current.push(marker)
      infoWindowsRef.current.push(infoWindow)
    })

    if (markersRef.current.length === 1) {
      map.setCenter(markersRef.current[0].getPosition() as google.maps.LatLng)
      map.setZoom(15)
    } else if (markersRef.current.length > 1) {
      map.fitBounds(bounds, 50)
    }
  }, [dict, locale])

  const escapeHtml = (text: string) => {
    if (typeof document === 'undefined') return text
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Fetch cafés by feature
  const fetchCafes = useCallback(async (lat: number, lng: number, searchRadius: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/cafes/nearby-feature?lat=${lat}&lng=${lng}&feature=${feature}&radius=${searchRadius}&limit=50`
      )

      if (!response.ok) {
        throw new Error(t(dict, 'find.failedFetchCafes'))
      }

      const data = await response.json()
      
      // Map API response to Cafe type
      const mappedCafes: CafeWithDistance[] = data.cafes.map((c: any) => ({
        id: c.id,
        place_id: c.place_id,
        name: c.name,
        description: c.description ?? null,
        ai_human_summary: null,
        ai_inference_notes: null,
        city: c.city ?? null,
        state: c.state ?? null,
        address: c.address ?? null,
        zip_code: null,
        country: null,
        latitude: c.lat,
        longitude: c.lng,
        location: null,
        google_maps_url: null,
        google_rating: c.google_rating ?? null,
        google_ratings_total: c.google_ratings_total ?? null,
        price_level: null,
        business_status: null,
        google_reviews: null,
        google_reviews_fetched_at: null,
        hours: null,
        phone: c.phone ?? null,
        website: c.website ?? null,
        work_score: c.work_score ?? null,
        is_work_friendly: c.is_work_friendly ?? null,
        ai_score: null,
        ai_confidence: null,
        ai_wifi_quality: c.ai_wifi_quality ?? null,
        ai_power_outlets: c.ai_power_outlets ?? null,
        ai_noise_level: c.ai_noise_level ?? null,
        ai_laptop_policy: c.ai_laptop_policy ?? null,
        ai_signals: null,
        ai_evidence: null,
        ai_reasons: null,
        ai_structured_json: null,
        ai_rated_at: null,
        is_active: null,
        is_verified: c.is_verified ?? null,
        created_at: c.created_at ?? null,
        updated_at: null,
        email: null,
        distance: c.distance,
      }))

      setCafes(mappedCafes)

      // Update map
      const map = mapInstanceRef.current
      if (map && mappedCafes.length > 0) {
        placeMarkers(map, mappedCafes)
        map.panTo({ lat, lng })
      }
    } catch (err: any) {
      setError(err?.message || t(dict, 'find.failedFetchCafes'))
      setCafes([])
    } finally {
      setLoading(false)
    }
  }, [feature, placeMarkers, dict])

  // Fetch with radius expansion until we have enough results (never punish for where they live)
  const fetchWithExpansion = useCallback(async (lat: number, lng: number) => {
    setLoading(true)
    setError(null)
    let lastCafes: CafeWithDistance[] = []
    let lastRadius: number = RADIUS_STEPS[0]
    try {
      for (const r of RADIUS_STEPS) {
        const res = await fetch(
          `/api/cafes/nearby-feature?lat=${lat}&lng=${lng}&feature=${feature}&radius=${r}&limit=50`
        )
        if (!res.ok) break
        const data = await res.json()
        const mapped: CafeWithDistance[] = (data.cafes ?? []).map((c: any) => ({
          id: c.id,
          place_id: c.place_id,
          name: c.name,
          description: c.description ?? null,
          ai_human_summary: null,
          ai_inference_notes: null,
          city: c.city ?? null,
          state: c.state ?? null,
          address: c.address ?? null,
          zip_code: null,
          country: null,
          latitude: c.lat,
          longitude: c.lng,
          location: null,
          google_maps_url: null,
          google_rating: c.google_rating ?? null,
          google_ratings_total: c.google_ratings_total ?? null,
          price_level: null,
          business_status: null,
          google_reviews: null,
          google_reviews_fetched_at: null,
          hours: null,
          phone: c.phone ?? null,
          website: c.website ?? null,
          work_score: c.work_score ?? null,
          is_work_friendly: c.is_work_friendly ?? null,
          ai_score: null,
          ai_confidence: null,
          ai_wifi_quality: c.ai_wifi_quality ?? null,
          ai_power_outlets: c.ai_power_outlets ?? null,
          ai_noise_level: c.ai_noise_level ?? null,
          ai_laptop_policy: c.ai_laptop_policy ?? null,
          ai_signals: null,
          ai_evidence: null,
          ai_reasons: null,
          ai_structured_json: null,
          ai_rated_at: null,
          is_active: null,
          is_verified: c.is_verified ?? null,
          created_at: c.created_at ?? null,
          updated_at: null,
          email: null,
          distance: c.distance,
        }))
        lastCafes = mapped
        lastRadius = r
        setCafes(mapped)
        setRadius(r)
        if (mapped.length >= MIN_RESULTS_THRESHOLD) break
      }
      const map = mapInstanceRef.current
      if (map && lastCafes.length > 0) {
        placeMarkers(map, lastCafes)
        map.panTo({ lat, lng })
      }
    } catch (err: any) {
      setError(err?.message || t(dict, 'find.failedFetchCafes'))
      setCafes([])
    } finally {
      setLoading(false)
    }
  }, [feature, placeMarkers, dict])

  // Request user location; on success, fetch with radius expansion
  const requestLocation = useCallback(() => {
    setLocationStatus('requesting')
    setError(null)

    if (!navigator.geolocation) {
      setLocationStatus('error')
      setError('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        setLocationStatus('granted')
        await fetchWithExpansion(latitude, longitude)
      },
      () => {
        setLocationStatus('denied')
        setError(t(dict, 'find.geolocationDeniedError'))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [fetchWithExpansion, dict])

  const searchByCity = useCallback(async () => {
    if (!manualCity.trim()) {
      setError(t(dict, 'find.errorEnterCity'))
      return
    }

    setLoading(true)
    setError(null)

    const cityLocation = BERLIN_CENTER
    setLocation(cityLocation)
    setLocationStatus('granted')
    setError(t(dict, 'find.searchingNearBerlin').replace('{city}', manualCity))
    await fetchCafes(cityLocation.lat, cityLocation.lng, radius)
  }, [manualCity, radius, fetchCafes, dict])

  // Load map on mount
  useEffect(() => {
    if (!apiKey) {
      setMapStatus('error')
      return
    }

    let cancelled = false

    const start = async () => {
      setMapStatus('loading')
      try {
        await loadGoogleMaps()
        if (cancelled) return
        initMap(BERLIN_CENTER)
      } catch (err: any) {
        if (cancelled) return
        setMapStatus('error')
        setError(err?.message || t(dict, 'find.failedLoadMaps'))
      }
    }

    start()

    return () => {
      cancelled = true
    }
  }, [apiKey, loadGoogleMaps, initMap, dict])

  // Default: Berlin (avoid empty state; never punish for where they live)
  useEffect(() => {
    if (mapStatus !== 'ready' || location !== null) return
    setLocation(BERLIN_CENTER)
    setLocationStatus('granted')
    fetchCafes(BERLIN_CENTER.lat, BERLIN_CENTER.lng, DEFAULT_RADIUS_M)
  }, [mapStatus, location, fetchCafes])

  // Reset visible count when cafes list changes
  useEffect(() => {
    setVisibleCount(INITIAL_CARDS)
  }, [cafes.length])

  // Update map when location changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (map && location && mapStatus === 'ready') {
      map.panTo({ lat: location.lat, lng: location.lng })
    }
  }, [location, mapStatus])

  if (!h1Key || !icon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t(dict, 'find.featureNotFound')}</h1>
          <p className="text-gray-600 mb-4">{t(dict, 'find.featureNotFoundDesc')}</p>
          <Link href={prefixWithLocale('/', locale)} className="text-primary-600 hover:text-primary-700 font-medium">
            {t(dict, 'find.backToHomepage')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href={prefixWithLocale('/', locale)} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              {t(dict, 'find.backToDirectory')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{icon}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t(dict, h1Key)}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            {descriptionKey ? t(dict, descriptionKey) : ''}
          </p>
          {FEATURE_NEAR_ME_KEYS[feature] && (
            <p className="mt-2 text-gray-600 max-w-3xl">
              {t(dict, FEATURE_NEAR_ME_KEYS[feature])}
            </p>
          )}
        </div>

        {/* Radius / error only when we have location */}
        {locationStatus === 'granted' && location && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-gray-600">
                {t(dict, 'find.radius')} {(radius / 1000).toFixed(1)} km
              </p>
              <label className="text-sm text-gray-600 flex items-center gap-2">
                {t(dict, 'find.radius')}
                <select
                  value={radius}
                  onChange={(e) => {
                    const newRadius = parseInt(e.target.value, 10)
                    setRadius(newRadius)
                    if (location) {
                      fetchCafes(location.lat, location.lng, newRadius)
                    }
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="3000">3 km</option>
                  <option value="5000">5 km</option>
                  <option value="10000">10 km</option>
                  <option value="20000">20 km</option>
                  <option value="50000">50 km</option>
                  <option value="100000">100 km</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="h-64 md:h-96 lg:h-[500px] relative bg-gray-100">
            {mapStatus === 'error' ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <p className="text-red-800 font-semibold mb-2">{t(dict, 'find.mapUnavailable')}</p>
                <p className="text-sm text-red-700 mb-3">
                  {apiKey ? t(dict, 'find.failedLoadMaps') : t(dict, 'find.mapsKeyNotConfigured')}
                </p>
                {!apiKey && (
                  <p className="text-xs text-gray-600">
                    {t(dict, 'find.setMapsKey')}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div ref={mapRef} className="w-full h-full" />
                <div className="absolute top-4 right-4 z-10">
                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={loading || isRequestingLocation}
                    className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t(dict, 'find.centerOnMyLocation')}
                    title={t(dict, 'find.centerOnMyLocation')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden>
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600">{t(dict, 'find.searchingForCafes')}</p>
              </div>
            ) : cafes.length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {t(dict, 'find.foundCafes')} {cafes.length} {cafes.length === 1 ? t(dict, 'common.cafe') : t(dict, 'common.cafes')}
                  </h2>
                  <p className="text-gray-600">
                    {t(dict, 'find.showingCafesWith')} {labelKey ? t(dict, labelKey) : ''} {t(dict, 'find.withinKm')} {(radius / 1000).toFixed(1)}&nbsp;km
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cafes.slice(0, visibleCount).map((cafe) => (
                    <CafeCard key={cafe.id} cafe={cafe} locale={locale} dict={dict} />
                  ))}
                </div>
                {visibleCount < cafes.length && (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => Math.min(prev + SHOW_MORE_STEP, cafes.length))}
                      aria-label={t(dict, 'find.showMoreAriaLabel')}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                    >
                      {t(dict, 'find.showMore')}
                    </button>
                  </div>
                )}
              </>
            ) : locationStatus === 'granted' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t(dict, 'find.noCafesFound')}</h3>
                <p className="text-gray-600 mb-6">
                  {t(dict, 'find.noCafesMatchingFeature')}
                </p>
                <button
                  onClick={() => location && fetchWithExpansion(location.lat, location.lng)}
                  className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  {t(dict, 'find.increaseSearchRadius')}
                </button>
              </div>
            ) : null}
          </>
        </div>

        {/* FAQ section (feature-specific, long-tail SEO) */}
        <section className="mt-16 pt-10 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t(dict, 'home.faq.title')}</h2>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => {
              const qKey = `find.faq.${feature}.q${i}`
              const aKey = `find.faq.${feature}.a${i}`
              const q = t(dict, qKey)
              const a = t(dict, aKey)
              if (q === qKey || a === aKey) return null
              return (
                <div key={i}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{q}</h3>
                  <p className="text-gray-600">{a}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Related links: other feature pages + city pages */}
        <section className="mt-16 pt-10 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t(dict, 'find.relatedFeatures')}</h2>
              <ul className="space-y-2">
                {FEATURE_SLUGS.filter((f) => f !== feature).map((slug) => (
                  <li key={slug}>
                    <Link
                      href={prefixWithLocale(`/find/${slug}`, locale)}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {t(dict, FEATURE_H1_KEYS[slug])}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t(dict, 'find.relatedCities')}</h2>
              <ul className="space-y-2">
                {RELATED_CITY_SLUGS.map((citySlug) => (
                  <li key={citySlug}>
                    <Link
                      href={prefixWithLocale(`/cities/${citySlug}`, locale)}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
