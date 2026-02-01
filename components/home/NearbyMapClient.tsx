'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCafeHref, hasValidCafeLink } from '@/lib/cafeRouting'
import { formatWorkScore } from '@/lib/utils/cafe-formatters'
import { getWebsiteDisplayName } from '@/lib/utils/url-validation'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { Locale } from '@/lib/i18n/config'
import { prefixWithLocale } from '@/lib/i18n/routing'

type NearbyApiCafe = {
  id: string
  place_id: string | null
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  description?: string | null
  lat: number | null
  lng: number | null
  distance: number
  workScore?: number | null
  isWorkFriendly?: boolean | null
  isVerified?: boolean | null
  googleRating?: number | null
  googleRatingsTotal?: number | null
  aiWifiQuality?: string | null
  aiPowerOutlets?: string | null
  aiNoiseLevel?: string | null
  aiLaptopPolicy?: string | null
  website?: string | null
  phone?: string | null
  createdAt?: string | null
}

type NearbyApiResponse = {
  center: { lat: number; lng: number }
  radius: number
  cafes: NearbyApiCafe[]
}

type CafeForMap = {
  id: string
  place_id: string | null
  name: string
  lat: number
  lng: number
  workScore?: number | null
  distance?: number
  address?: string | null
  city?: string | null
  state?: string | null
  description?: string | null
  isWorkFriendly?: boolean | null
  isVerified?: boolean | null
  googleRating?: number | null
  googleRatingsTotal?: number | null
  aiWifiQuality?: string | null
  aiPowerOutlets?: string | null
  aiNoiseLevel?: string | null
  aiLaptopPolicy?: string | null
  website?: string | null
  phone?: string | null
  createdAt?: string | null
}

type MapStatus = 'idle' | 'loading' | 'ready' | 'error'
type DataStatus = 'idle' | 'loading' | 'success' | 'error'

import { BERLIN_CENTER as BERLIN_CENTER_CONST, RADIUS_STEPS, MIN_RESULTS_THRESHOLD, DEFAULT_RADIUS_M } from '@/lib/location-constants'

const BERLIN_CENTER = BERLIN_CENTER_CONST
const BERLIN_RADIUS = DEFAULT_RADIUS_M

/** Create LatLngBounds from center + radius (meters). Used to track last-fetched area. */
function boundsFromCenterRadius(lat: number, lng: number, radiusM: number): google.maps.LatLngBounds {
  const degPerMeterLat = 1 / 111320
  const degPerMeterLng = 1 / (111320 * Math.cos((lat * Math.PI) / 180))
  const dLat = (radiusM * degPerMeterLat)
  const dLng = (radiusM * degPerMeterLng)
  return new google.maps.LatLngBounds(
    { lat: lat - dLat, lng: lng - dLng },
    { lat: lat + dLat, lng: lng + dLng }
  )
}

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
    workscore7Plus: false,
  })
  const [sortBy, setSortBy] = useState<'distance' | 'workscore' | 'laptopFriendly' | 'recentlyAdded'>('distance')
  const [locationHint, setLocationHint] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const boundsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingFromBoundsRef = useRef(false)
  const lastFetchBoundsRef = useRef<google.maps.LatLngBounds | null>(null)
  const lastFetchZoomRef = useRef<number | null>(null)
  const ignoreBoundsUntilRef = useRef<number>(0)

  // Initialize filters from URL params on mount
  useEffect(() => {
    const outlets = searchParams.get('power') === '1'
    const quiet = searchParams.get('quiet') === '1'
    const noTimeLimit = searchParams.get('noTimeLimit') === '1'
    const workscore7Plus = searchParams.get('workscore7') === '1'

    setFilters({
      outlets,
      quiet,
      noTimeLimit,
      workscore7Plus,
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
      center: BERLIN_CENTER,
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    })
    mapInstanceRef.current = map
  }, [])

  // --- Helpers ---
  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null))
    infoWindowsRef.current.forEach((iw) => iw.close())
    markersRef.current = []
    infoWindowsRef.current = []
  }

  const renderInfoContent = (cafe: CafeForMap) => {
    const cafeHref = getCafeHref({ place_id: cafe.place_id, id: cafe.id }, locale)
    const hasLink = hasValidCafeLink(cafe)
    const addressLine = [cafe.address, cafe.city, cafe.state].filter(Boolean).join(', ')
    const distanceText = cafe.distance != null ? `${(cafe.distance / 1000).toFixed(1)} ${t(dict, 'home.map.kmAway')}` : ''
    const wsFormatted = formatWorkScore(cafe.workScore)

    const ratingStars = (rating: number) => {
      const full = Math.floor(rating)
      const hasHalf = rating % 1 >= 0.5
      const empty = 5 - full - (hasHalf ? 1 : 0)
      let html = ''
      for (let i = 0; i < full; i++) html += '<span style="color:#eab308">★</span>'
      if (hasHalf) html += '<span style="color:#eab308">☆</span>'
      for (let i = 0; i < empty; i++) html += '<span style="color:#d1d5db">★</span>'
      return html + `<span style="margin-left:8px;font-size:13px;color:#4b5563">${rating.toFixed(1)}</span>`
    }

    const noiseBadgeStyle = (level: string) => {
      const l = level.toLowerCase()
      if (l.includes('quiet')) return 'background:#dcfce7;color:#166534'
      if (l.includes('moderate')) return 'background:#fef9c3;color:#854d0e'
      if (l.includes('loud')) return 'background:#fee2e2;color:#991b1b'
      if (l.includes('variable')) return 'background:#dbeafe;color:#1e40af'
      return 'background:#f3f4f6;color:#1f2937'
    }

    const features: string[] = []
    if (cafe.isWorkFriendly) features.push(`<span style="display:inline-flex;align-items:center;gap:4px;font-size:14px;color:#374151">✅ ${t(dict, 'common.workFriendly')}</span>`)
    if (cafe.aiWifiQuality) features.push(`<span style="display:inline-flex;align-items:center;gap:4px;font-size:14px;color:#374151">📶 ${escapeHtml(cafe.aiWifiQuality)}</span>`)
    if (cafe.aiPowerOutlets) features.push(`<span style="display:inline-flex;align-items:center;gap:4px;font-size:14px;color:#374151">🔌 ${escapeHtml(cafe.aiPowerOutlets)}</span>`)
    if (cafe.aiNoiseLevel) features.push(`<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:500;border-radius:9999px;padding:2px 8px;${noiseBadgeStyle(cafe.aiNoiseLevel)}">🔊 ${escapeHtml(cafe.aiNoiseLevel)}</span>`)
    if (cafe.aiLaptopPolicy) features.push(`<span style="display:inline-flex;align-items:center;gap:4px;font-size:14px;color:#374151">💻 ${escapeHtml(cafe.aiLaptopPolicy)}</span>`)

    return `
      <div style="font-family:system-ui,-apple-system,sans-serif;background:#fff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.1);min-width:320px;max-width:380px;">
        <div style="padding:24px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div style="flex:1;">
              <h3 style="margin:0 0 4px 0;font-size:20px;font-weight:600;color:#111827;line-height:1.3;">
                ${hasLink ? `<a href="${escapeHtml(cafeHref)}" style="color:inherit;text-decoration:none" target="_blank" rel="noopener noreferrer">${escapeHtml(cafe.name)}</a>` : escapeHtml(cafe.name)}
              </h3>
              ${addressLine ? `<p style="margin:0 0 4px 0;font-size:14px;color:#4b5563;">${escapeHtml(addressLine)}</p>` : ''}
              ${distanceText ? `<p style="margin:0;font-size:12px;color:#6b7280;">${escapeHtml(distanceText)}</p>` : ''}
            </div>
            ${cafe.isVerified ? '<span style="margin-left:8px;color:#2563eb" title="' + escapeHtml(t(dict, 'cafeCard.verified')) + '">✓</span>' : ''}
          </div>
          ${cafe.description ? `<p style="font-size:14px;color:#374151;margin:0 0 16px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(cafe.description)}</p>` : ''}
          ${(cafe.googleRating || cafe.workScore) ? `
            <div style="margin-bottom:16px;">
              ${cafe.googleRating ? `<div style="display:flex;align-items:center;">${ratingStars(cafe.googleRating)}</div>` : ''}
              ${wsFormatted ? `<div style="margin-top:8px;"><span style="font-size:14px;font-weight:500;color:#2563eb">${escapeHtml(t(dict, 'common.workScore'))} ${escapeHtml(wsFormatted)}</span></div>` : ''}
              ${cafe.googleRatingsTotal && cafe.googleRatingsTotal > 0 ? `<p style="margin:4px 0 0 0;font-size:12px;color:#6b7280">${cafe.googleRatingsTotal} ${cafe.googleRatingsTotal === 1 ? escapeHtml(t(dict, 'common.review')) : escapeHtml(t(dict, 'common.reviews'))}</p>` : ''}
            </div>
          ` : ''}
          ${features.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">${features.join('')}</div>` : ''}
          <div style="padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div style="display:flex;gap:16px;font-size:14px;">
              ${cafe.website ? `<a href="${escapeHtml(cafe.website)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:500;text-decoration:none">${escapeHtml(getWebsiteDisplayName(cafe.website))}</a>` : ''}
              ${cafe.phone ? `<a href="tel:${escapeHtml(cafe.phone)}" style="color:#4b5563;text-decoration:none">${escapeHtml(cafe.phone)}</a>` : ''}
            </div>
            ${hasLink ? `<a href="${escapeHtml(cafeHref)}" target="_blank" rel="noopener noreferrer" style="font-size:14px;font-weight:500;color:#2563eb;text-decoration:none">${escapeHtml(t(dict, 'common.viewDetailsLink'))}</a>` : `<span style="font-size:14px;color:#9ca3af">${escapeHtml(t(dict, 'common.unavailable'))}</span>`}
          </div>
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
      })

      const infoWindow = new google.maps.InfoWindow({
        content: renderInfoContent(cafe),
        maxWidth: 400,
      })

      marker.addListener('click', () => {
        infoWindowsRef.current.forEach((iw) => iw.close())
        infoWindow.open(map, marker)
        ignoreBoundsUntilRef.current = Date.now() + 1500
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
            workScore: c.workScore ?? null,
            distance: c.distance,
            address: c.address,
            city: c.city,
            state: c.state,
            description: c.description,
            isWorkFriendly: c.isWorkFriendly,
            isVerified: c.isVerified,
            googleRating: c.googleRating,
            googleRatingsTotal: c.googleRatingsTotal,
            aiWifiQuality: c.aiWifiQuality,
            aiPowerOutlets: c.aiPowerOutlets,
            aiNoiseLevel: c.aiNoiseLevel,
            aiLaptopPolicy: c.aiLaptopPolicy,
            website: c.website,
            phone: c.phone,
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
            workScore: c.workScore ?? null,
            distance: c.distance,
            address: c.address,
            city: c.city,
            state: c.state,
            description: c.description,
            isWorkFriendly: c.isWorkFriendly,
            isVerified: c.isVerified,
            googleRating: c.googleRating,
            googleRatingsTotal: c.googleRatingsTotal,
            aiWifiQuality: c.aiWifiQuality,
            aiPowerOutlets: c.aiPowerOutlets,
            aiNoiseLevel: c.aiNoiseLevel,
            aiLaptopPolicy: c.aiLaptopPolicy,
            website: c.website,
            phone: c.phone,
            createdAt: c.createdAt,
          }))

        setCafes(mapped)
        lastFetchBoundsRef.current = bounds
        lastFetchZoomRef.current = mapInstanceRef.current?.getZoom() ?? null
        const map = mapInstanceRef.current
        if (map) {
          isUpdatingFromBoundsRef.current = true
          placeMarkers(map, mapped)
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
    if (mapStatus === 'ready' && mapInstanceRef.current && window.google?.maps) {
      isUpdatingFromBoundsRef.current = true
      setHasMapMoved(false)
      lastFetchBoundsRef.current = boundsFromCenterRadius(BERLIN_CENTER.lat, BERLIN_CENTER.lng, BERLIN_RADIUS)
      lastFetchZoomRef.current = mapInstanceRef.current.getZoom() ?? 13
      fetchNearby(BERLIN_CENTER.lat, BERLIN_CENTER.lng, BERLIN_RADIUS).finally(() => {
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
      if (isUpdatingFromBoundsRef.current) return
      if (Date.now() < ignoreBoundsUntilRef.current) return

      const bounds = map.getBounds()
      if (!bounds) return

      if (boundsUpdateTimeoutRef.current) {
        clearTimeout(boundsUpdateTimeoutRef.current)
      }

      if (autoUpdate) {
        boundsUpdateTimeoutRef.current = setTimeout(() => {
          if (Date.now() < ignoreBoundsUntilRef.current) return
          const lastBounds = lastFetchBoundsRef.current
          const lastZoom = lastFetchZoomRef.current
          const center = bounds.getCenter()
          const zoom = map.getZoom() ?? 13
          const centerStillInBounds = lastBounds && lastBounds.contains(center)
          const zoomChangedSignificantly = lastZoom != null && Math.abs(zoom - lastZoom) > 1
          if (centerStillInBounds && !zoomChangedSignificantly) {
            setHasMapMoved(false)
            return
          }
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

  const handleFullscreen = useCallback(() => {
    const el = mapRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true))
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false))
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const handleUseLocation = () => {
    setError(null)
    setLocationHint(null)
    setHasMapMoved(false)
    if (!navigator.geolocation) {
      setLocationHint(t(dict, 'home.map.geolocationUnsupported'))
      setTimeout(() => setLocationHint(null), 3000)
      return
    }
    setDataStatus('loading')
    isUpdatingFromBoundsRef.current = true

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        let lastCafes: CafeForMap[] = []
        let lastRadiusUsed = RADIUS_STEPS[RADIUS_STEPS.length - 1]
        for (const r of RADIUS_STEPS) {
          const res = await fetch(`/api/cafes/nearby?lat=${latitude}&lng=${longitude}&radius=${r}`)
          if (!res.ok) break
          const data = (await res.json()) as NearbyApiResponse
          const mapped: CafeForMap[] = (data.cafes ?? [])
            .filter((c) => c.lat != null && c.lng != null)
            .map((c) => ({
              id: c.id,
              place_id: c.place_id,
              name: c.name,
              lat: c.lat!,
              lng: c.lng!,
              workScore: c.workScore ?? null,
              distance: c.distance,
              address: c.address,
              city: c.city,
              state: c.state,
              description: c.description,
              isWorkFriendly: c.isWorkFriendly,
              isVerified: c.isVerified,
              googleRating: c.googleRating,
              googleRatingsTotal: c.googleRatingsTotal,
              aiWifiQuality: c.aiWifiQuality,
              aiPowerOutlets: c.aiPowerOutlets,
              aiNoiseLevel: c.aiNoiseLevel,
              aiLaptopPolicy: c.aiLaptopPolicy,
              website: c.website,
              phone: c.phone,
              createdAt: c.createdAt,
            }))
          lastCafes = mapped
          lastRadiusUsed = r
          setCafes(mapped)
          setCenter({ lat: latitude, lng: longitude })
          setDataStatus('success')
          if (mapped.length >= MIN_RESULTS_THRESHOLD) break
        }
        setIsUserLocation(true)
        lastFetchBoundsRef.current = boundsFromCenterRadius(latitude, longitude, lastRadiusUsed)
        lastFetchZoomRef.current = mapInstanceRef.current?.getZoom() ?? null
        const map = mapInstanceRef.current
        if (map) {
          map.panTo({ lat: latitude, lng: longitude })
          placeMarkers(map, lastCafes)
        }
        setTimeout(() => { isUpdatingFromBoundsRef.current = false }, 1000)
      },
      () => {
        setDataStatus('success')
        setIsUserLocation(false)
        setLocationHint(t(dict, 'home.map.locationDenied'))
        setTimeout(() => setLocationHint(null), 4000)
        isUpdatingFromBoundsRef.current = false
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

    if (newFilters.workscore7Plus) {
      params.set('workscore7', '1')
    } else {
      params.delete('workscore7')
    }

    // Update URL without page reload
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [searchParams, router])

  // Compute laptop-friendly score from AI fields and work score
  const computeLaptopFriendlyScore = useCallback((cafe: CafeForMap): number => {
    let score = (cafe.workScore ?? 0) * 10 // work_score 0-10 -> 0-100 base

    const hasWifi = cafe.aiWifiQuality && cafe.aiWifiQuality.trim().toLowerCase() !== 'unknown'
    const hasOutlets = cafe.aiPowerOutlets && cafe.aiPowerOutlets.trim().toLowerCase() !== 'unknown'

    if (hasWifi) score += 15
    if (hasOutlets) score += 15

    const noise = (cafe.aiNoiseLevel || '').toLowerCase()
    if (noise.includes('quiet')) score += 15
    else if (noise.includes('moderate')) score += 10
    else if (noise.includes('loud')) score += 3

    const policy = (cafe.aiLaptopPolicy || '').toLowerCase()
    if (policy.includes('no limit') || policy.includes('unlimited') || policy.includes('kein limit')) score += 10

    return score
  }, [])

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback((cafesList: CafeForMap[]) => {
    let filtered = [...cafesList]

    // Apply filters
    if (filters.outlets) {
      filtered = filtered.filter((c) => c.aiPowerOutlets && c.aiPowerOutlets.trim().toLowerCase() !== 'unknown')
    }
    if (filters.noTimeLimit) {
      filtered = filtered.filter((c) => {
        const policy = (c.aiLaptopPolicy || '').toLowerCase()
        return policy.includes('no limit') || policy.includes('unlimited') || policy.includes('kein limit')
      })
    }
    if (filters.quiet) {
      filtered = filtered.filter((c) => (c.aiNoiseLevel || '').toLowerCase().includes('quiet'))
    }
    if (filters.workscore7Plus) {
      filtered = filtered.filter((c) => (c.workScore ?? 0) > 7)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0)
        case 'workscore': {
          const wsDiff = (b.workScore ?? 0) - (a.workScore ?? 0)
          if (wsDiff !== 0) return wsDiff
          return (a.distance || 0) - (b.distance || 0)
        }
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
    if (filters.workscore7Plus) count++
    return count
  }, [filters])

  const hasActiveFilters = activeFilterCount > 0

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      outlets: false,
      quiet: false,
      noTimeLimit: false,
      workscore7Plus: false,
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
    <div className="space-y-4 pb-0">
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
                <button
                  onClick={() => setFilters({ ...filters, workscore7Plus: !filters.workscore7Plus })}
                  aria-pressed={filters.workscore7Plus}
                  aria-label={`Filter by Workscore 7+. ${filters.workscore7Plus ? 'Active' : 'Inactive'}`}
                  className={`px-3 py-1 text-xs font-medium rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                    filters.workscore7Plus
                      ? 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {t(dict, 'home.map.workscore7Plus')}
                </button>
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
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map container - takes more space on desktop */}
          <div className="w-full lg:flex-1 relative lg:h-[600px]">
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

            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={dataStatus === 'loading' || mapStatus === 'loading'}
                className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg leading-none"
                aria-label={t(dict, 'home.map.centerOnMyLocation')}
                title={t(dict, 'home.map.centerOnMyLocation')}
              >
                <span aria-hidden>🧭</span>
              </button>
              <button
                type="button"
                onClick={handleFullscreen}
                className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors text-base leading-none"
                aria-label={isFullscreen ? t(dict, 'home.map.fullscreenExit') : t(dict, 'home.map.fullscreenToggle')}
                title={isFullscreen ? t(dict, 'home.map.fullscreenExit') : t(dict, 'home.map.fullscreenToggle')}
              >
                <span aria-hidden>{isFullscreen ? '⛶' : '⛶'}</span>
              </button>
            </div>

            <div className="w-full h-96 lg:h-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
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
                {error || t(dict, 'home.map.couldNotFetch')}
              </p>
            )}

            {dataStatus === 'success' && cafes.length === 0 && (
              <p className="mt-4 text-sm text-gray-600">
                {t(dict, 'home.map.noCafesInArea')}
              </p>
            )}

            {locationHint && (
              <p className="mt-4 text-sm text-gray-500" role="status">
                {locationHint}
              </p>
            )}

            {dataStatus === 'success' && cafes.length > 0 && (
              <p className="mt-4 text-sm text-gray-500">
                {t(dict, 'home.map.panZoomHint')}
              </p>
            )}
          </div>

          {/* Results list - sidebar on desktop, below on mobile */}
          {filteredCafes.length > 0 ? (
            <div className="w-full lg:w-80 lg:flex-shrink-0 lg:h-[600px] flex flex-col">
              {isUpdatingResults && (
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 shrink-0">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>{t(dict, 'home.map.updatingResults')}</span>
                </div>
              )}
              {/* Results header with Sort dropdown */}
              <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Results</h3>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select-results" className="text-xs text-gray-600 font-medium">
                    {t(dict, 'home.map.sort')}
                  </label>
                  <select
                    id="sort-select-results"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'distance' | 'workscore' | 'laptopFriendly' | 'recentlyAdded')}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="distance">{t(dict, 'home.map.nearest')}</option>
                    <option value="workscore">{t(dict, 'home.map.highestWorkscore')}</option>
                    <option value="laptopFriendly">{t(dict, 'home.map.mostLaptopFriendly')}</option>
                    <option value="recentlyAdded">{t(dict, 'home.map.recentlyAdded')}</option>
                  </select>
                </div>
              </div>
              {/* Scrollable results list */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
                {filteredCafes.slice(0, 6).map((cafe) => (
                  <Link
                    key={cafe.id}
                    href={getCafeHref({ place_id: cafe.place_id, id: cafe.id }, locale)}
                    className="block border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 hover:shadow-sm transition-all group"
                    aria-label={`${cafe.name} - ${t(dict, 'common.viewDetailsLink')}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 group-hover:text-primary-600 truncate">{cafe.name}</p>
                        {cafe.address && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{cafe.address}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {cafe.distance != null
                            ? `${(cafe.distance / 1000).toFixed(2)} ${t(dict, 'home.map.kmAway')}`
                            : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-gray-400 group-hover:text-primary-600 transition-colors" aria-hidden>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.06l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs mt-2">
                      {(cafe.workScore != null && cafe.workScore >= 0) && (
                        <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md font-medium">
                          {formatWorkScore(cafe.workScore)}
                        </span>
                      )}
                      {cafe.aiWifiQuality && cafe.aiWifiQuality.toLowerCase() !== 'unknown' && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                          📶 {cafe.aiWifiQuality}
                        </span>
                      )}
                      {cafe.aiPowerOutlets && cafe.aiPowerOutlets.toLowerCase() !== 'unknown' && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md">🔌 {cafe.aiPowerOutlets}</span>
                      )}
                      {cafe.aiNoiseLevel && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md capitalize">🔊 {cafe.aiNoiseLevel}</span>
                      )}
                      {cafe.aiLaptopPolicy && (cafe.aiLaptopPolicy.toLowerCase().includes('no limit') || cafe.aiLaptopPolicy.toLowerCase().includes('unlimited') || cafe.aiLaptopPolicy.toLowerCase().includes('kein limit')) ? (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md">{t(dict, 'home.map.noLimit')}</span>
                      ) : cafe.aiLaptopPolicy ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">💻 {cafe.aiLaptopPolicy}</span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : cafes.length > 0 ? (
            <div className="w-full lg:w-80 lg:flex-shrink-0 lg:h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Results</h3>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8 text-sm text-gray-600">
                  {t(dict, 'home.map.noMatchFilters')}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
