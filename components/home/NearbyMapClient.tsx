'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCafeHref } from '@/lib/cafeRouting'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { Locale } from '@/lib/i18n/config'
import { prefixWithLocale } from '@/lib/i18n/routing'

type NearbyApiResponse = {
  center: { lat: number; lng: number }
  radius: number
  cafes: Array<{
    id: string
    place_id: string | null
    name: string
    lat: number | null
    lng: number | null
    distance: number
    wifi: { available: boolean; speedRating?: number | null }
    outlets: { available: boolean; rating?: number | null }
    noise: string | null
    timeLimit: number | null
    rating: number | null
    coffeeQuality?: 'unknown' | 'low' | 'medium' | 'high'
    createdAt: string | null
  }>
}

type CafeForMap = {
  id: string
  place_id: string | null
  name: string
  lat: number
  lng: number
  wifi?: { available: boolean; speedRating?: number | null }
  outlets?: { available: boolean; rating?: number | null }
  noise?: string | null
  timeLimit?: number | null
  rating?: number | null
  coffeeQuality?: 'unknown' | 'low' | 'medium' | 'high'
  distance?: number
  city?: string | null
  createdAt?: string | null
}

type MapStatus = 'idle' | 'loading' | 'ready' | 'error'
type DataStatus = 'idle' | 'loading' | 'success' | 'error'

const BERLIN_CENTER = { lat: 52.52, lng: 13.405 }
const BERLIN_RADIUS = 3000 // meters
const USER_LOCATION_RADIUS = 2000 // meters

export default function NearbyMapClient({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const router = useRouter()
  const searchParams = useSearchParams()

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([])

  const [mapStatus, setMapStatus] = useState<MapStatus>('idle')
  const [dataStatus, setDataStatus] = useState<DataStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [cafes, setCafes] = useState<CafeForMap[]>([])
  const [filteredCafes, setFilteredCafes] = useState<CafeForMap[]>([])
  const [center, setCenter] = useState<{ lat: number; lng: number }>(BERLIN_CENTER)
  const [isUserLocation, setIsUserLocation] = useState(false)
  const [isUpdatingResults, setIsUpdatingResults] = useState(false)
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [hasMapMoved, setHasMapMoved] = useState(false)
  const [pendingBounds, setPendingBounds] = useState<google.maps.LatLngBounds | null>(null)
  const [filters, setFilters] = useState({
    outlets: false,
    quiet: false,
    noTimeLimit: false,
    minRating: 0,
    coffeeQuality: false,
  })
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'laptopFriendly' | 'recentlyAdded'>('distance')
  const boundsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingFromBoundsRef = useRef(false)

  // Initialize filters from URL params on mount
  useEffect(() => {
    const outlets = searchParams.get('power') === '1'
    const quiet = searchParams.get('quiet') === '1'
    const noTimeLimit = searchParams.get('noTimeLimit') === '1'
    const minRatingStr = searchParams.get('minRating')
    const minRating = minRatingStr ? parseFloat(minRatingStr) : 0
    const coffeeQuality = searchParams.get('coffee') === '1'

    setFilters({
      outlets,
      quiet,
      noTimeLimit,
      minRating: minRating >= 0 && minRating <= 5 ? minRating : 0,
      coffeeQuality,
    })
  }, [searchParams]) // Re-run if searchParams change

  // --- Script loader ---
  const loadGoogleMaps = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (window.google?.maps) return

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

  // --- Map init ---
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) return

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
    })
    mapInstanceRef.current = map
  }, [center])

  // --- Helpers ---
  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null))
    infoWindowsRef.current.forEach((iw) => iw.close())
    markersRef.current = []
    infoWindowsRef.current = []
  }

  const renderInfoContent = (cafe: CafeForMap) => {
    const wifiLabel = cafe.wifi?.available
      ? `Wi-Fi${cafe.wifi.speedRating ? ` ${cafe.wifi.speedRating}/5` : ''}`
      : '—'
    const outletsLabel = cafe.outlets?.available
      ? `Outlets${cafe.outlets.rating ? ` ${cafe.outlets.rating}/5` : ''}`
      : '—'
    const noiseLabel = cafe.noise ? cafe.noise : '—'
    const timeLabel = cafe.timeLimit ? `${cafe.timeLimit} min` : t(dict, 'home.map.noLimit')
    const distanceText = cafe.distance ? `${(cafe.distance / 1000).toFixed(2)} km` : ''
    const cafeHref = getCafeHref({ place_id: cafe.place_id, id: cafe.id }, locale)
    const viewDetailsLink = t(dict, 'home.map.viewDetailsLink')

    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 0; min-width: 240px;">
        <div style="padding: 16px;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #111827; line-height: 1.3;">
            ${escapeHtml(cafe.name)}
          </h3>
          ${distanceText ? `<p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280;">${escapeHtml(distanceText)}</p>` : ''}
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-size: 13px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #2563eb; font-weight: 500;">Wi‑Fi:</span>
              <span style="color: ${cafe.wifi?.available ? '#059669' : '#9ca3af'};">${escapeHtml(wifiLabel)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #7c3aed; font-weight: 500;">Outlets:</span>
              <span style="color: ${cafe.outlets?.available ? '#059669' : '#9ca3af'};">${escapeHtml(outletsLabel)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #d97706; font-weight: 500;">Noise:</span>
              <span style="color: ${cafe.noise ? '#374151' : '#9ca3af'}; text-transform: capitalize;">${escapeHtml(noiseLabel)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #dc2626; font-weight: 500;">Time:</span>
              <span style="color: ${cafe.timeLimit ? '#dc2626' : '#059669'};">${escapeHtml(timeLabel)}</span>
            </div>
          </div>
          <a 
            href="${escapeHtml(cafeHref)}" 
            style="display: inline-flex; align-items: center; justify-content: center; margin-top: 4px; padding: 8px 16px; font-size: 14px; font-weight: 500; color: #ffffff; background-color: #2563eb; border-radius: 6px; text-decoration: none; transition: background-color 0.2s;"
            onmouseover="this.style.backgroundColor='#1d4ed8'"
            onmouseout="this.style.backgroundColor='#2563eb'"
          >
            ${escapeHtml(viewDetailsLink)}
          </a>
        </div>
      </div>
    `
  }

  const escapeHtml = (text: string) => {
    if (typeof document === 'undefined') return text
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const placeMarkers = (map: google.maps.Map, cafes: CafeForMap[]) => {
    clearMarkers()
    if (cafes.length === 0) return

    const bounds = new google.maps.LatLngBounds()

    cafes.forEach((cafe) => {
      if (cafe.lat == null || cafe.lng == null) return
      const position = new google.maps.LatLng(cafe.lat, cafe.lng)
      bounds.extend(position)

      const marker = new google.maps.Marker({
        position,
        map,
        title: cafe.name,
        animation: google.maps.Animation.DROP,
      })

      const infoWindow = new google.maps.InfoWindow({
        content: renderInfoContent(cafe),
        maxWidth: 300,
      })

      marker.addListener('click', () => {
        infoWindowsRef.current.forEach((iw) => iw.close())
        infoWindow.open(map, marker)
      })

      markersRef.current.push(marker)
      infoWindowsRef.current.push(infoWindow)
    })

    // Only auto-fit bounds if not updating from user interaction (avoid loop)
    if (!isUpdatingFromBoundsRef.current) {
      if (markersRef.current.length === 1) {
        map.setCenter(markersRef.current[0].getPosition() as google.maps.LatLng)
        map.setZoom(15)
      } else {
        map.fitBounds(bounds, 50)
      }
    }
  }

  const fetchNearby = useCallback(
    async (lat: number, lng: number, radius: number) => {
      setDataStatus('loading')
      setError(null)
      try {
        const res = await fetch(`/api/cafes/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
        if (!res.ok) {
          throw new Error(t(dict, 'home.map.failedLoadNearby'))
        }
        const data = (await res.json()) as NearbyApiResponse
        const mapped: CafeForMap[] = data.cafes
          .filter((c) => c.lat != null && c.lng != null)
          .map((c) => ({
            id: c.id,
            place_id: c.place_id,
            name: c.name,
            lat: c.lat!,
            lng: c.lng!,
            wifi: c.wifi,
            outlets: c.outlets,
            noise: c.noise,
            timeLimit: c.timeLimit,
            rating: c.rating,
            coffeeQuality: c.coffeeQuality,
            distance: c.distance,
            createdAt: c.createdAt,
          }))

        setCafes(mapped)
        setCenter({ lat, lng })
        setDataStatus('success')

        const map = mapInstanceRef.current
        if (map) {
          map.panTo({ lat, lng })
          placeMarkers(map, mapped)
        }
      } catch (err: any) {
        setDataStatus('error')
        setError(err?.message || 'Something went wrong while fetching nearby cafés.')
        setCafes([])
      }
    },
    []
  )

  const fetchByBounds = useCallback(
    async (bounds: google.maps.LatLngBounds) => {
      setIsUpdatingResults(true)
      setError(null)
      try {
        const ne = bounds.getNorthEast()
        const sw = bounds.getSouthWest()

        const res = await fetch(
          `/api/cafes/nearby?neLat=${ne.lat()}&neLng=${ne.lng()}&swLat=${sw.lat()}&swLng=${sw.lng()}`
        )
        if (!res.ok) {
          throw new Error(t(dict, 'home.map.failedLoadCafes'))
        }
        const data = (await res.json()) as NearbyApiResponse
        const mapped: CafeForMap[] = data.cafes
          .filter((c) => c.lat != null && c.lng != null)
          .map((c) => ({
            id: c.id,
            place_id: c.place_id,
            name: c.name,
            lat: c.lat!,
            lng: c.lng!,
            wifi: c.wifi,
            outlets: c.outlets,
            noise: c.noise,
            timeLimit: c.timeLimit,
            rating: c.rating,
            coffeeQuality: c.coffeeQuality,
            distance: c.distance,
            createdAt: c.createdAt,
          }))

        setCafes(mapped)
        const map = mapInstanceRef.current
        if (map) {
          isUpdatingFromBoundsRef.current = true
          placeMarkers(map, mapped)
          // Reset flag after a short delay
          setTimeout(() => {
            isUpdatingFromBoundsRef.current = false
          }, 100)
        }
      } catch (err: any) {
        setError(err?.message || t(dict, 'home.map.fetchErrorGeneric'))
      } finally {
        setIsUpdatingResults(false)
      }
    },
    []
  )

  // Load Google Maps and init map
  useEffect(() => {
    if (!apiKey) {
      setMapStatus('error')
      setError(t(dict, 'home.map.mapsKeyHint'))
      return
    }

    let cancelled = false

    const start = async () => {
      setMapStatus('loading')
      try {
        await loadGoogleMaps()
        if (cancelled) return
        initMap()
        setMapStatus('ready')
      } catch (err: any) {
        if (cancelled) return
        setMapStatus('error')
        setError(err?.message || t(dict, 'home.map.couldNotLoadMaps'))
      }
    }

    start()

    return () => {
      cancelled = true
    }
  }, [apiKey, loadGoogleMaps, initMap, dict])

  // After map is ready, fetch Berlin cafes (initial load)
  useEffect(() => {
    if (mapStatus === 'ready' && mapInstanceRef.current) {
      // Temporarily disable bounds updates during initial load
      isUpdatingFromBoundsRef.current = true
      setHasMapMoved(false)
      fetchNearby(BERLIN_CENTER.lat, BERLIN_CENTER.lng, BERLIN_RADIUS).finally(() => {
        // Re-enable bounds updates after initial load completes
        setTimeout(() => {
          isUpdatingFromBoundsRef.current = false
        }, 1000)
      })
      setIsUserLocation(false)
    }
  }, [mapStatus, fetchNearby])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (boundsUpdateTimeoutRef.current) {
        clearTimeout(boundsUpdateTimeoutRef.current)
      }
    }
  }, [])

  // Setup bounds listener after map and fetchByBounds are ready
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.google?.maps || mapStatus !== 'ready') return

    // Remove any existing listeners
    google.maps.event.clearListeners(map, 'bounds_changed')

    // Add bounds listener
    map.addListener('bounds_changed', () => {
      // Don't trigger if we're programmatically updating
      if (isUpdatingFromBoundsRef.current) return

      const bounds = map.getBounds()
      if (!bounds) return

      // Clear existing timeout
      if (boundsUpdateTimeoutRef.current) {
        clearTimeout(boundsUpdateTimeoutRef.current)
      }

      if (autoUpdate) {
        // Automatic mode: debounce and update
        boundsUpdateTimeoutRef.current = setTimeout(() => {
          fetchByBounds(bounds)
          setHasMapMoved(false)
        }, 500)
      } else {
        // Manual mode: show button and store bounds
        boundsUpdateTimeoutRef.current = setTimeout(() => {
          setHasMapMoved(true)
          setPendingBounds(bounds)
        }, 300)
      }
    })

    // Cleanup listener on unmount or dependency change
    return () => {
      if (map && window.google?.maps) {
        google.maps.event.clearListeners(map, 'bounds_changed')
      }
    }
  }, [mapStatus, autoUpdate, fetchByBounds])

  const handleUseLocation = () => {
    setError(null)
    setDataStatus('loading')
    setHasMapMoved(false)
    if (!navigator.geolocation) {
      setDataStatus('error')
      setError(t(dict, 'home.map.geolocationUnsupported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        // Disable bounds updates during user location fetch
        isUpdatingFromBoundsRef.current = true
        await fetchNearby(latitude, longitude, USER_LOCATION_RADIUS)
        setIsUserLocation(true)
        // Re-enable after a short delay
        setTimeout(() => {
          isUpdatingFromBoundsRef.current = false
        }, 1000)
      },
      () => {
        setDataStatus('error')
        setError('Location permission denied. Please allow location or browse all cafés.')
        setIsUserLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSearchThisArea = () => {
    if (pendingBounds) {
      fetchByBounds(pendingBounds)
      setHasMapMoved(false)
      setPendingBounds(null)
    }
  }

  // Update URL params when filters change
  const updateURLParams = useCallback((newFilters: typeof filters) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (newFilters.outlets) {
      params.set('power', '1')
    } else {
      params.delete('power')
    }

    if (newFilters.quiet) {
      params.set('quiet', '1')
    } else {
      params.delete('quiet')
    }

    if (newFilters.noTimeLimit) {
      params.set('noTimeLimit', '1')
    } else {
      params.delete('noTimeLimit')
    }

    if (newFilters.minRating > 0) {
      params.set('minRating', newFilters.minRating.toString())
    } else {
      params.delete('minRating')
    }

    if (newFilters.coffeeQuality) {
      params.set('coffee', '1')
    } else {
      params.delete('coffee')
    }

    // Update URL without page reload
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [searchParams, router])

  // Compute laptop-friendly score
  const computeLaptopFriendlyScore = useCallback((cafe: CafeForMap): number => {
    let score = 0

    // Wi-Fi availability and speed (max 25 points)
    if (cafe.wifi?.available) {
      score += 10
      if (cafe.wifi.speedRating) {
        score += (cafe.wifi.speedRating / 5) * 15 // Up to 15 more points based on speed
      }
    }

    // Power outlets availability and rating (max 25 points)
    if (cafe.outlets?.available) {
      score += 10
      if (cafe.outlets.rating) {
        score += (cafe.outlets.rating / 5) * 15 // Up to 15 more points based on rating
      }
    }

    // Noise level (max 25 points)
    if (cafe.noise === 'quiet') {
      score += 25
    } else if (cafe.noise === 'moderate') {
      score += 15
    } else if (cafe.noise === 'loud') {
      score += 5
    }

    // Time limit (max 25 points)
    if (!cafe.timeLimit || cafe.timeLimit === null) {
      score += 25 // No time limit is best
    } else if (cafe.timeLimit >= 180) {
      score += 20 // 3+ hours is good
    } else if (cafe.timeLimit >= 120) {
      score += 15 // 2+ hours is acceptable
    } else if (cafe.timeLimit >= 60) {
      score += 10 // 1+ hour is okay
    } else {
      score += 5 // Less than 1 hour
    }

    return score
  }, [])

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback((cafesList: CafeForMap[]) => {
    let filtered = [...cafesList]

    // Apply filters
    if (filters.outlets) {
      filtered = filtered.filter((c) => c.outlets?.available)
    }
    if (filters.noTimeLimit) {
      filtered = filtered.filter((c) => !c.timeLimit || c.timeLimit === null)
    }
    if (filters.quiet) {
      filtered = filtered.filter((c) => c.noise === 'quiet')
    }
    if (filters.minRating > 0) {
      filtered = filtered.filter((c) => (c.rating || 0) >= filters.minRating)
    }
    if (filters.coffeeQuality) {
      // Filter by coffee quality: only show high or medium quality cafes
      filtered = filtered.filter((c) => c.coffeeQuality === 'high' || c.coffeeQuality === 'medium')
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'laptopFriendly':
          return computeLaptopFriendlyScore(b) - computeLaptopFriendlyScore(a)
        case 'recentlyAdded':
          if (!a.createdAt && !b.createdAt) return 0
          if (!a.createdAt) return 1
          if (!b.createdAt) return -1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    setFilteredCafes(filtered)
  }, [filters, sortBy, computeLaptopFriendlyScore])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.outlets) count++
    if (filters.quiet) count++
    if (filters.noTimeLimit) count++
    if (filters.minRating > 0) count++
    if (filters.coffeeQuality) count++
    return count
  }, [filters])

  const hasActiveFilters = activeFilterCount > 0

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      outlets: false,
      quiet: false,
      noTimeLimit: false,
      minRating: 0,
      coffeeQuality: false,
    }
    setFilters(clearedFilters)
    updateURLParams(clearedFilters)
  }, [updateURLParams])

  // Apply filters when cafes or filter/sort changes
  useEffect(() => {
    if (cafes.length > 0) {
      applyFiltersAndSort(cafes)
    } else {
      setFilteredCafes([])
    }
  }, [cafes, filters, sortBy, applyFiltersAndSort])

  // Track if filters were initialized from URL to avoid circular updates
  const filtersInitializedRef = useRef(false)

  // Update URL when filters change (but not on initial mount)
  useEffect(() => {
    // Only update URL if filters have been initialized (either from URL or default)
    if (filtersInitializedRef.current) {
      updateURLParams(filters)
    } else {
      filtersInitializedRef.current = true
    }
  }, [filters, updateURLParams])

  // Update markers when filtered cafes change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (map && filteredCafes.length > 0) {
      isUpdatingFromBoundsRef.current = true
      placeMarkers(map, filteredCafes)
      setTimeout(() => {
        isUpdatingFromBoundsRef.current = false
      }, 100)
    } else if (map && cafes.length === 0) {
      clearMarkers()
    }
  }, [filteredCafes])

  if (!apiKey) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-semibold mb-1">{t(dict, 'home.map.mapsKeyMissing')}</p>
        <p className="text-sm text-red-700">{t(dict, 'home.map.mapsKeyHint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls - constrained width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={handleUseLocation}
            disabled={dataStatus === 'loading' || mapStatus === 'loading'}
            className="px-5 py-3 rounded-lg bg-primary-600 text-white font-semibold shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {dataStatus === 'loading' || mapStatus === 'loading'
              ? t(dict, 'home.map.loading')
              : t(dict, 'home.map.useLocation')}
          </button>
          <Link
            href={prefixWithLocale('/cities', locale)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {t(dict, 'home.map.browseAll')}
          </Link>
        </div>
      </div>

      {/* Map + Results Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sticky Filter Bar */}
        <div className="sticky top-0 z-20 mb-4">
          <div className="bg-white border border-gray-200 rounded-md px-4 py-2.5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Active filters indicator */}
              {hasActiveFilters && (
                <div className="text-xs text-gray-600 font-medium">
                  {t(dict, 'home.map.activeFilters')}{' '}
                  <span className="font-semibold text-primary-700">{activeFilterCount}</span>
                </div>
              )}

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilters({ ...filters, outlets: !filters.outlets })}
                  aria-pressed={filters.outlets}
                  aria-label={`Filter by power outlets. ${filters.outlets ? 'Active' : 'Inactive'}`}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                    filters.outlets
                      ? 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {t(dict, 'home.map.powerOutlets')}
                </button>
                <button
                  onClick={() => setFilters({ ...filters, quiet: !filters.quiet })}
                  aria-pressed={filters.quiet}
                  aria-label={`Filter by quiet cafes. ${filters.quiet ? 'Active' : 'Inactive'}`}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                    filters.quiet
                      ? 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {t(dict, 'home.map.quiet')}
                </button>
                <button
                  onClick={() => setFilters({ ...filters, noTimeLimit: !filters.noTimeLimit })}
                  aria-pressed={filters.noTimeLimit}
                  aria-label={`Filter by cafes with no time limit. ${filters.noTimeLimit ? 'Active' : 'Inactive'}`}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                    filters.noTimeLimit
                      ? 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {t(dict, 'home.map.noTimeLimit')}
                </button>
                <div className="flex items-center gap-1">
                  <label htmlFor="rating-filter" className="text-xs text-gray-600">
                    {t(dict, 'home.map.rating')}
                  </label>
                  <select
                    id="rating-filter"
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                    aria-label="Filter by minimum rating"
                    className={`px-2 py-1 text-xs border-2 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      filters.minRating > 0
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="0">{t(dict, 'home.map.any')}</option>
                    <option value="3.0">3.0+</option>
                    <option value="3.5">3.5+</option>
                    <option value="4.0">4.0+</option>
                    <option value="4.5">4.5+</option>
                  </select>
                </div>
                {(() => {
                  // Check if all cafes have unknown coffee quality
                  const allUnknown = cafes.length > 0 && cafes.every(
                    (c) => !c.coffeeQuality || c.coffeeQuality === 'unknown'
                  )
                  
                  if (allUnknown) {
                    return null // Hide the filter if all cafes are unknown
                  }
                  
                  return (
                    <button
                      onClick={() => setFilters({ ...filters, coffeeQuality: !filters.coffeeQuality })}
                      aria-pressed={filters.coffeeQuality}
                      aria-label={`Filter by coffee quality. ${filters.coffeeQuality ? 'Active' : 'Inactive'}`}
                      className={`px-3 py-1 text-xs font-medium rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                        filters.coffeeQuality
                          ? 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {t(dict, 'home.map.coffeeQuality')}
                    </button>
                  )
                })()}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  aria-label={`${t(dict, 'home.map.clear')} ${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`}
                  className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                >
                  {t(dict, 'home.map.clear')}
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <label htmlFor="sort-select" className="text-xs text-gray-600 font-medium">
                  {t(dict, 'home.map.sort')}
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating' | 'laptopFriendly' | 'recentlyAdded')}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="distance">{t(dict, 'home.map.nearest')}</option>
                  <option value="rating">{t(dict, 'home.map.highestRated')}</option>
                  <option value="laptopFriendly">{t(dict, 'home.map.mostLaptopFriendly')}</option>
                  <option value="recentlyAdded">{t(dict, 'home.map.recentlyAdded')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map container - takes more space on desktop */}
          <div className="w-full lg:flex-1 relative">
            {/* Floating "Search this area" button */}
            {hasMapMoved && !autoUpdate && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={handleSearchThisArea}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                >
                  {t(dict, 'home.map.searchThisArea')}
                </button>
              </div>
            )}

            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => {
                  setAutoUpdate(!autoUpdate)
                  setHasMapMoved(false)
                  setPendingBounds(null)
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                title={autoUpdate ? t(dict, 'home.map.autoTitle') : t(dict, 'home.map.manualTitle')}
              >
                {autoUpdate ? t(dict, 'home.map.auto') : t(dict, 'home.map.manual')}
              </button>
            </div>

            <div className="w-full h-96 lg:h-[600px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {mapStatus === 'error' ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <p className="text-red-800 font-semibold mb-2">{t(dict, 'home.map.failedToLoadMap')}</p>
                  <p className="text-sm text-red-700 mb-3">{error || t(dict, 'home.map.couldNotLoadMaps')}</p>
                  <button
                    onClick={() => {
                      setError(null)
                      setMapStatus('idle')
                      loadGoogleMaps()
                        .then(() => {
                          initMap()
                          setMapStatus('ready')
                        })
                        .catch((err) => {
                          setMapStatus('error')
                          setError(err?.message || t(dict, 'home.map.couldNotLoadMaps'))
                        })
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    {t(dict, 'home.map.retry')}
                  </button>
                </div>
              ) : (
                <div ref={mapRef} className="w-full h-full" />
              )}
            </div>

            {/* Inline messaging */}
            {dataStatus === 'error' && (
              <p className="mt-4 text-sm text-amber-700">
                {error || t(dict, 'home.map.couldNotFetch')} Showing Berlin if available.
              </p>
            )}

            {dataStatus === 'success' && cafes.length === 0 && (
              <p className="mt-4 text-sm text-gray-600">
                {t(dict, 'home.map.noCafesInArea')}
              </p>
            )}

            {dataStatus === 'success' && cafes.length > 0 && !isUserLocation && (
              <p className="mt-4 text-sm text-gray-600">
                {t(dict, 'home.map.showingBerlin')}
              </p>
            )}
          </div>

          {/* Results list - sidebar on desktop, below on mobile */}
          {filteredCafes.length > 0 ? (
            <div className="w-full lg:w-80 lg:flex-shrink-0">
              {isUpdatingResults && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>{t(dict, 'home.map.updatingResults')}</span>
                </div>
              )}
              <div className="space-y-4">
                {filteredCafes.slice(0, 6).map((cafe) => (
                  <div
                    key={cafe.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors"
                  >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{cafe.name}</p>
                  <p className="text-sm text-gray-600">
                    {cafe.distance
                      ? `${(cafe.distance / 1000).toFixed(2)} ${t(dict, 'home.map.kmAway')}`
                      : ''}
                  </p>
                </div>
                <Link
                  href={getCafeHref({ place_id: cafe.place_id, id: cafe.id }, locale)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t(dict, 'home.map.viewDetails')}
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-700 mt-2">
                {cafe.wifi?.available && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                    Wi-Fi{cafe.wifi.speedRating ? ` ${cafe.wifi.speedRating}/5` : ''}
                  </span>
                )}
                {cafe.outlets?.available && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
                    Outlets{cafe.outlets.rating ? ` ${cafe.outlets.rating}/5` : ''}
                  </span>
                )}
                {cafe.noise && (
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md capitalize">
                    {cafe.noise} noise
                  </span>
                )}
                {cafe.timeLimit ? (
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md">
                    {cafe.timeLimit} {t(dict, 'home.map.minLimit')}
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md">
                    {t(dict, 'home.map.noLimit')}
                  </span>
                )}
                  </div>
                </div>
                ))}
              </div>
            </div>
          ) : cafes.length > 0 ? (
            <div className="w-full lg:w-80 lg:flex-shrink-0">
              <div className="text-center py-8 text-sm text-gray-600">
                {t(dict, 'home.map.noMatchFilters')}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
