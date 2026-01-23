'use client'

import { useEffect, useRef, useState } from 'react'
import { getCafeHref } from '@/lib/cafeRouting'

// Type definitions for cafe data
export type CafeForMap = {
  id: string
  place_id: string | null
  name: string
  lat: number
  lng: number
  wifi?: {
    available: boolean
    speedRating?: number | null
  }
  outlets?: {
    available: boolean
    rating?: number | null
  }
  noise?: string | null
  timeLimit?: number | null
  rating?: number | null
  city?: string | null
  distance?: number // meters
}

type NearbyCafesMapProps = {
  center: { lat: number; lng: number }
  cafes: CafeForMap[]
  className?: string
}

// Google Maps types (minimal, just what we need)
declare global {
  interface Window {
    google: typeof google
  }
}

type GoogleMap = google.maps.Map
type GoogleMarker = google.maps.Marker
type GoogleInfoWindow = google.maps.InfoWindow
type GoogleLatLng = google.maps.LatLng
type GoogleLatLngBounds = google.maps.LatLngBounds

export default function NearbyCafesMap({ center, cafes, className = '' }: NearbyCafesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<GoogleMap | null>(null)
  const markersRef = useRef<GoogleMarker[]>([])
  const infoWindowsRef = useRef<GoogleInfoWindow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true)
      return
    }

    // Check API key
    if (!apiKey) {
      setLoadError('Google Maps API key is not configured.')
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true))
      return
    }

    // Load the script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => setLoadError('Failed to load Google Maps.')
    document.head.appendChild(script)
  }, [apiKey])

  // Initialize map once
  useEffect(() => {
    if (!isLoaded || !window.google?.maps || !mapRef.current || mapInstanceRef.current) return

    const google = window.google

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom: 12,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
    })

    mapInstanceRef.current = map
  }, [isLoaded, center.lat, center.lng])

  // Update map center smoothly when center prop changes
  useEffect(() => {
    if (!isLoaded || !window.google?.maps || !mapInstanceRef.current) return

    const google = window.google
    const map = mapInstanceRef.current
    const target = new google.maps.LatLng(center.lat, center.lng)

    map.panTo(target)
    // When user location is used, a slightly closer zoom feels better.
    // fitBounds (below) will override this when multiple markers exist.
    if (cafes.length === 0) {
      map.setZoom(12)
    } else if (cafes.length === 1) {
      map.setZoom(14)
    }
  }, [isLoaded, center.lat, center.lng, cafes.length])

  // Update markers and fit bounds
  useEffect(() => {
    if (!isLoaded || !window.google?.maps || !mapInstanceRef.current) return

    const google = window.google
    const map = mapInstanceRef.current

    // Clear existing markers and info windows
    markersRef.current.forEach((marker) => marker.setMap(null))
    infoWindowsRef.current.forEach((iw) => iw.close())
    markersRef.current = []
    infoWindowsRef.current = []

    if (cafes.length === 0) {
      return
    }

    const bounds = new google.maps.LatLngBounds()
    const markers: GoogleMarker[] = []
    const infoWindows: GoogleInfoWindow[] = []

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

      markers.push(marker)

      const content = createInfoWindowContent(cafe)
      const infoWindow = new google.maps.InfoWindow({
        content,
        maxWidth: 300,
      })

      infoWindows.push(infoWindow)

      marker.addListener('click', () => {
        infoWindows.forEach((iw) => iw.close())
        infoWindow.open(map, marker)
      })
    })

    markersRef.current = markers
    infoWindowsRef.current = infoWindows

    if (markers.length === 1) {
      // Single marker: zoom in a bit around it
      map.setCenter(markers[0].getPosition() as google.maps.LatLng)
      map.setZoom(15)
    } else if (markers.length > 1) {
      // Multiple markers: fit bounds with padding
      map.fitBounds(bounds, 50)
    }
  }, [isLoaded, cafes])

  // Render info window content
  function createInfoWindowContent(cafe: CafeForMap): string {
    // Wi-Fi field
    const wifiLabel = cafe.wifi?.available
      ? `Wi-Fi${cafe.wifi.speedRating ? ` ${cafe.wifi.speedRating}/5` : ''}`
      : '—'

    // Outlets field
    const outletsLabel = cafe.outlets?.available
      ? `Outlets${cafe.outlets.rating ? ` ${cafe.outlets.rating}/5` : ''}`
      : '—'

    // Noise field
    const noiseLabel = cafe.noise ? cafe.noise.charAt(0).toUpperCase() + cafe.noise.slice(1) : '—'

    // Time limit field
    const timeLimitLabel = cafe.timeLimit
      ? `${cafe.timeLimit} min`
      : 'No limit'

    const distanceText = cafe.distance ? ` • ${(cafe.distance / 1000).toFixed(2)} km` : ''
    const cityText = cafe.city ? `${cafe.city}${distanceText}` : distanceText ? distanceText.slice(3) : ''
    
    // Compute href using routing helper
    const cafeHref = getCafeHref({ place_id: cafe.place_id, id: cafe.id })

    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 0; min-width: 240px;">
        <div style="padding: 16px;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #111827; line-height: 1.3;">
            ${escapeHtml(cafe.name)}
          </h3>
          ${cityText ? `<p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280;">${escapeHtml(cityText)}</p>` : ''}
          
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
              <span style="color: ${cafe.timeLimit ? '#dc2626' : '#059669'};">${escapeHtml(timeLimitLabel)}</span>
            </div>
          </div>
          
          <a 
            href="${escapeHtml(cafeHref)}" 
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

  function escapeHtml(text: string): string {
    if (typeof document === 'undefined') return text
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Fallback if API key is missing
  if (!apiKey) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600 mb-2">Google Maps is not configured.</p>
        <p className="text-sm text-gray-500">
          Please set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment variables.
        </p>
      </div>
    )
  }

  // Loading state
  if (!isLoaded && !loadError) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="text-gray-600 mt-4">Loading map...</p>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center ${className}`}>
        <p className="text-red-800 font-medium mb-2">Failed to load map</p>
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    )
  }

  // Map container
  return (
    <div className={`w-full h-96 rounded-lg overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
