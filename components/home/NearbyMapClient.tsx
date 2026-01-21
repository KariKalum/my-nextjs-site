'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

type NearbyApiResponse = {
  center: { lat: number; lng: number }
  radius: number
  cafes: Array<{
    id: string
    name: string
    lat: number | null
    lng: number | null
    distance: number
    wifi: { available: boolean; speedRating?: number | null }
    outlets: { available: boolean; rating?: number | null }
    noise: string | null
    timeLimit: number | null
    rating: number | null
    slug: string
  }>
}

type CafeForMap = {
  id: string
  name: string
  lat: number
  lng: number
  slug: string
  wifi?: { available: boolean; speedRating?: number | null }
  outlets?: { available: boolean; rating?: number | null }
  noise?: string | null
  timeLimit?: number | null
  rating?: number | null
  distance?: number
  city?: string | null
}

type MapStatus = 'idle' | 'loading' | 'ready' | 'error'
type DataStatus = 'idle' | 'loading' | 'success' | 'error'

const BERLIN_CENTER = { lat: 52.52, lng: 13.405 }
const BERLIN_RADIUS = 3000 // meters
const USER_LOCATION_RADIUS = 2000 // meters

export default function NearbyMapClient() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([])

  const [mapStatus, setMapStatus] = useState<MapStatus>('idle')
  const [dataStatus, setDataStatus] = useState<DataStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [cafes, setCafes] = useState<CafeForMap[]>([])
  const [center, setCenter] = useState<{ lat: number; lng: number }>(BERLIN_CENTER)
  const [isUserLocation, setIsUserLocation] = useState(false)

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
    const timeLabel = cafe.timeLimit ? `${cafe.timeLimit} min` : 'No limit'

    const distanceText = cafe.distance ? `${(cafe.distance / 1000).toFixed(2)} km` : ''

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
            href="/cafe/${escapeHtml(cafe.slug)}" 
            style="display: inline-flex; align-items: center; justify-content: center; margin-top: 4px; padding: 8px 16px; font-size: 14px; font-weight: 500; color: #ffffff; background-color: #2563eb; border-radius: 6px; text-decoration: none; transition: background-color 0.2s;"
            onmouseover="this.style.backgroundColor='#1d4ed8'"
            onmouseout="this.style.backgroundColor='#2563eb'"
          >
            View details →
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

    if (markersRef.current.length === 1) {
      map.setCenter(markersRef.current[0].getPosition() as google.maps.LatLng)
      map.setZoom(15)
    } else {
      map.fitBounds(bounds, 50)
    }
  }

  const fetchNearby = useCallback(
    async (lat: number, lng: number, radius: number) => {
      setDataStatus('loading')
      setError(null)
      try {
        const res = await fetch(`/api/cafes/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
        if (!res.ok) {
          throw new Error('Failed to load nearby cafés')
        }
        const data = (await res.json()) as NearbyApiResponse
        const mapped: CafeForMap[] = data.cafes
          .filter((c) => c.lat != null && c.lng != null)
          .map((c) => ({
            id: c.id,
            name: c.name,
            lat: c.lat!,
            lng: c.lng!,
            slug: c.slug,
            wifi: c.wifi,
            outlets: c.outlets,
            noise: c.noise,
            timeLimit: c.timeLimit,
            rating: c.rating,
            distance: c.distance,
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

  // Load Google Maps and init map
  useEffect(() => {
    if (!apiKey) {
      setMapStatus('error')
      setError('Google Maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.')
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
        setError(err?.message || 'Failed to load Google Maps.')
      }
    }

    start()

    return () => {
      cancelled = true
    }
  }, [apiKey, loadGoogleMaps, initMap])

  // After map is ready, fetch Berlin cafes
  useEffect(() => {
    if (mapStatus === 'ready' && mapInstanceRef.current) {
      fetchNearby(BERLIN_CENTER.lat, BERLIN_CENTER.lng, BERLIN_RADIUS)
      setIsUserLocation(false)
    }
  }, [mapStatus, fetchNearby])

  const handleUseLocation = () => {
    setError(null)
    setDataStatus('loading')
    if (!navigator.geolocation) {
      setDataStatus('error')
      setError('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        await fetchNearby(latitude, longitude, USER_LOCATION_RADIUS)
        setIsUserLocation(true)
      },
      () => {
        setDataStatus('error')
        setError('Location permission denied. Please allow location or browse all cafés.')
        setIsUserLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // --- UI States ---
  if (!apiKey) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-semibold mb-1">Maps API key missing</p>
        <p className="text-sm text-red-700">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleUseLocation}
          disabled={dataStatus === 'loading' || mapStatus === 'loading'}
          className="px-5 py-3 rounded-lg bg-primary-600 text-white font-semibold shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {dataStatus === 'loading' || mapStatus === 'loading' ? 'Loading…' : 'Use my location'}
        </button>
        <Link
          href="/cities"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Browse all cities →
        </Link>
      </div>

      {/* Map container */}
      <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
        {mapStatus === 'error' ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="text-red-800 font-semibold mb-2">Failed to load map</p>
            <p className="text-sm text-red-700 mb-3">{error || 'Could not load Google Maps.'}</p>
            <button
              onClick={() => {
                setError(null)
                setMapStatus('idle')
                // retry load
                loadGoogleMaps()
                  .then(() => {
                    initMap()
                    setMapStatus('ready')
                  })
                  .catch((err) => {
                    setMapStatus('error')
                    setError(err?.message || 'Failed to load Google Maps.')
                  })
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}
      </div>

      {/* Inline messaging */}
      {dataStatus === 'error' && (
        <p className="text-sm text-amber-700">
          {error || 'Could not fetch cafés.'} Showing Berlin if available.
        </p>
      )}

      {dataStatus === 'success' && cafes.length === 0 && (
        <p className="text-sm text-gray-600">
          No cafés found in this area yet.
        </p>
      )}

      {dataStatus === 'success' && cafes.length > 0 && !isUserLocation && (
        <p className="text-sm text-gray-600">
          Showing cafés in Berlin. Click “Use my location” to see cafés near you.
        </p>
      )}

      {/* Results list */}
      {cafes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cafes.slice(0, 6).map((cafe) => (
            <div
              key={cafe.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{cafe.name}</p>
                  <p className="text-sm text-gray-600">
                    {cafe.distance ? `${(cafe.distance / 1000).toFixed(2)} km away` : ''}
                  </p>
                </div>
                <Link
                  href={`/cafe/${cafe.slug}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View details
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
                    {cafe.timeLimit} min limit
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md">
                    No time limit
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
