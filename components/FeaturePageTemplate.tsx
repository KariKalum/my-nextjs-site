'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import type { Cafe } from '@/src/lib/supabase/types'
import CafeCard from '@/components/CafeCard'
import { getCafeHref } from '@/lib/cafeRouting'

type FeatureConfig = {
  key: string
  title: string
  intro: string
  icon: string
}

const FEATURE_CONFIGS: Record<string, FeatureConfig> = {
  wifi: {
    key: 'wifi',
    title: 'Find cafés with fast Wi-Fi',
    intro: 'Discover laptop-friendly cafés with high-speed internet connections. Perfect for video calls, streaming, and productive remote work.',
    icon: '📶',
  },
  outlets: {
    key: 'outlets',
    title: 'Find cafés with power outlets',
    intro: 'Never worry about your laptop battery. Find cafés with plenty of power outlets (Steckdosen) to keep you charged all day.',
    icon: '🔌',
  },
  quiet: {
    key: 'quiet',
    title: 'Find quiet cafés',
    intro: 'Focus without distractions. Discover cafés with quiet or moderate noise levels, perfect for deep work and concentration.',
    icon: '🔇',
  },
  'time-limit': {
    key: 'time-limit',
    title: 'Find time-limit friendly cafés',
    intro: 'Work as long as you need. Explore cafés with no time restrictions, so you can stay productive without worrying about time limits.',
    icon: '⏰',
  },
}

type CafeWithDistance = Cafe & {
  distance?: number
}

type FeaturePageTemplateProps = {
  feature: string
}

const DEFAULT_RADIUS = 5000 // 5km
const MAX_RADIUS = 20000 // 20km
const BERLIN_CENTER = { lat: 52.52, lng: 13.405 }

export default function FeaturePageTemplate({ feature }: FeaturePageTemplateProps) {
  const config = FEATURE_CONFIGS[feature]
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
  const [radius, setRadius] = useState(DEFAULT_RADIUS)

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

  // Place markers on map
  const placeMarkers = useCallback((map: google.maps.Map, cafesList: CafeWithDistance[]) => {
    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null))
    infoWindowsRef.current.forEach((iw) => iw.close())
    markersRef.current = []
    infoWindowsRef.current = []

    if (cafesList.length === 0) return

    const bounds = new google.maps.LatLngBounds()

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
            ${cafe.distance ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">${(cafe.distance / 1000).toFixed(2)} km away</p>` : ''}
            <a 
              href="${escapeHtml(getCafeHref(cafe))}" 
              style="display: inline-block; margin-top: 8px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #ffffff; background-color: #2563eb; border-radius: 6px; text-decoration: none;"
            >
              View details →
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
  }, [])

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
        throw new Error('Failed to fetch cafés')
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
      setError(err?.message || 'Failed to fetch cafés. Please try again.')
      setCafes([])
    } finally {
      setLoading(false)
    }
  }, [feature, placeMarkers])

  // Request user location
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
        await fetchCafes(latitude, longitude, radius)
      },
      () => {
        setLocationStatus('denied')
        setError('Location permission denied. Please use the city search below or allow location access.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [fetchCafes, radius])

  // Search by city (fallback)
  const searchByCity = useCallback(async () => {
    if (!manualCity.trim()) {
      setError('Please enter a city name')
      return
    }

    setLoading(true)
    setError(null)

    // For city search, use a default location (Berlin center)
    // In production, you could integrate a geocoding service here
    // For now, we'll use Berlin as fallback and inform the user
    const cityLocation = BERLIN_CENTER
    setLocation(cityLocation)
    setLocationStatus('granted')
    
    // Show a friendly message that we're using Berlin as default
    setError(`Searching near Berlin center. For accurate results, please allow location access or visit the city page for "${manualCity}".`)
    
    await fetchCafes(cityLocation.lat, cityLocation.lng, radius)
  }, [manualCity, radius, fetchCafes])

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
        // Initialize with Berlin center (will update when location is set)
        initMap(BERLIN_CENTER)
      } catch (err: any) {
        if (cancelled) return
        setMapStatus('error')
        setError(err?.message || 'Failed to load Google Maps.')
      }
    }

    start()

    return () => {
      cancelled = true
    }
  }, [apiKey, loadGoogleMaps, initMap])

  // Update map when location changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (map && location && mapStatus === 'ready') {
      map.panTo({ lat: location.lat, lng: location.lng })
    }
  }, [location, mapStatus])

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Feature not found</h1>
          <p className="text-gray-600 mb-4">The requested feature page does not exist.</p>
          <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
            Back to homepage →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              ← Back to Directory
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title & Intro */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{config.icon}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {config.title}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            {config.intro}
          </p>
        </div>

        {/* Location Request / Manual Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {(locationStatus === 'idle' || locationStatus === 'denied' || locationStatus === 'error') ? (
            <div className="space-y-4">
              <div>
                <button
                  onClick={requestLocation}
                  disabled={loading || isRequestingLocation}
                  className="w-full md:w-auto px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading || isRequestingLocation ? 'Requesting location...' : '📍 Use my location'}
                </button>
              </div>
              {locationStatus === 'denied' && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Location access denied. Search by city instead:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={manualCity}
                      onChange={(e) => setManualCity(e.target.value)}
                      placeholder="Enter city name (e.g., Berlin)"
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          searchByCity()
                        }
                      }}
                    />
                    <button
                      onClick={searchByCity}
                      disabled={loading || !manualCity.trim()}
                      className="px-6 py-2.5 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : locationStatus === 'granted' && location ? (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Searching near your location</p>
                <p className="text-xs text-gray-500">
                  Radius: {(radius / 1000).toFixed(1)} km
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">
                  Radius:
                  <select
                    value={radius}
                    onChange={(e) => {
                      const newRadius = parseInt(e.target.value, 10)
                      setRadius(newRadius)
                      if (location) {
                        fetchCafes(location.lat, location.lng, newRadius)
                      }
                    }}
                    className="ml-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="3000">3 km</option>
                    <option value="5000">5 km</option>
                    <option value="10000">10 km</option>
                    <option value="20000">20 km</option>
                  </select>
                </label>
                <button
                  onClick={requestLocation}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Change location
                </button>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="h-64 md:h-96 lg:h-[500px] relative bg-gray-100">
            {mapStatus === 'error' ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <p className="text-red-800 font-semibold mb-2">Map unavailable</p>
                <p className="text-sm text-red-700 mb-3">
                  {apiKey ? 'Failed to load Google Maps.' : 'Google Maps API key not configured.'}
                </p>
                {!apiKey && (
                  <p className="text-xs text-gray-600">
                    Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable maps.
                  </p>
                )}
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full" />
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Searching for cafés...</p>
            </div>
          ) : cafes.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Found {cafes.length} {cafes.length === 1 ? 'café' : 'cafés'}
                </h2>
                <p className="text-gray-600">
                  Showing cafés with {config.title.toLowerCase().replace('find cafés with ', '')} within {(radius / 1000).toFixed(1)} km
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cafes.map((cafe) => (
                  <CafeCard key={cafe.id} cafe={cafe} />
                ))}
              </div>
            </>
          ) : locationStatus === 'granted' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No cafés found</h3>
              <p className="text-gray-600 mb-6">
                We couldn&apos;t find any cafés matching this feature in your area.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const newRadius = Math.min(radius * 2, MAX_RADIUS)
                    setRadius(newRadius)
                    if (location) {
                      fetchCafes(location.lat, location.lng, newRadius)
                    }
                  }}
                  className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Increase search radius
                </button>
                <div>
                  <Link
                    href="/cities"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Browse all cities →
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
