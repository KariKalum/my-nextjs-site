import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// Mark as dynamic since we use request.url for query params
export const dynamic = 'force-dynamic'

type CafeRecord = {
  id: string
  place_id: string | null
  name: string
  city: string | null
  latitude: number | null
  longitude: number | null
  work_score: number | null
  ai_score: number | null
  is_active: boolean
  created_at: string | null
}

const EARTH_RADIUS_M = 6371000 // meters

/** Haversine distance in meters between two lat/lng pairs */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const latStr = searchParams.get('lat') || ''
    const lngStr = searchParams.get('lng') || ''
    const radiusStr = searchParams.get('radius') || ''
    const neLatStr = searchParams.get('neLat')
    const neLngStr = searchParams.get('neLng')
    const swLatStr = searchParams.get('swLat')
    const swLngStr = searchParams.get('swLng')

    let lat: number | null = null
    let lng: number | null = null
    let radius = 2000

    // Support both bounds-based (preferred) and center+radius queries
    if (neLatStr && neLngStr && swLatStr && swLngStr) {
      // Bounds-based query
      const neLat = parseFloat(neLatStr)
      const neLng = parseFloat(neLngStr)
      const swLat = parseFloat(swLatStr)
      const swLng = parseFloat(swLngStr)

      if (
        Number.isNaN(neLat) || Number.isNaN(neLng) ||
        Number.isNaN(swLat) || Number.isNaN(swLng)
      ) {
        return NextResponse.json(
          { error: 'Bounds parameters must be valid numbers' },
          { status: 400 }
        )
      }

      // Calculate center from bounds
      lat = (neLat + swLat) / 2
      lng = (neLng + swLng) / 2

      // Calculate approximate radius from bounds (diagonal distance / 2)
      const centerLat = lat
      const centerLng = lng
      const halfDiagonal = haversineDistance(centerLat, centerLng, neLat, neLng)
      radius = Math.min(halfDiagonal * 1.2, 10000) // Add 20% padding, max 10km
    } else {
      // Center+radius query (legacy)
      // Validate that lat/lng are provided and not empty
      if (!latStr || !lngStr || latStr.trim() === '' || lngStr.trim() === '') {
        return NextResponse.json(
          { error: 'lat and lng are required' },
          { status: 400 }
        )
      }

      lat = parseFloat(latStr)
      lng = parseFloat(lngStr)

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return NextResponse.json(
          { error: 'lat and lng must be valid numbers' },
          { status: 400 }
        )
      }

      // Radius: default 2000, clamp to max 10000
      radius = parseInt(radiusStr || '2000', 10)
      if (Number.isNaN(radius)) radius = 2000
      radius = Math.min(radius, 10000)
    }

    // Validate ranges
    if (lat === null || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'lat must be between -90 and 90' },
        { status: 400 }
      )
    }
    if (lng === null || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'lng must be between -180 and 180' },
        { status: 400 }
      )
    }

    // Round lat/lng slightly to improve cache hit rate (~11m precision)
    lat = Math.round(lat * 10000) / 10000
    lng = Math.round(lng * 10000) / 10000

    const supabase = await createClient()

    // Bounding box pre-filter
    let minLat: number, maxLat: number, minLng: number, maxLng: number

    if (neLatStr && neLngStr && swLatStr && swLngStr) {
      // Use provided bounds directly
      minLat = Math.max(-90, parseFloat(swLatStr))
      maxLat = Math.min(90, parseFloat(neLatStr))
      // Handle longitude wrap-around (e.g., across 180/-180)
      const swLng = parseFloat(swLngStr)
      const neLng = parseFloat(neLngStr)
      if (swLng <= neLng) {
        minLng = swLng
        maxLng = neLng
      } else {
        // Crosses antimeridian
        minLng = -180
        maxLng = 180
      }
    } else {
      // Calculate bounds from center + radius
      const angularDistance = radius / EARTH_RADIUS_M // radians
      const deltaLat = (angularDistance * 180) / Math.PI
      const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.1)
      const deltaLng = (angularDistance * 180) / (Math.PI * cosLat)

      minLat = Math.max(-90, lat - deltaLat)
      maxLat = Math.min(90, lat + deltaLat)
      minLng = Math.max(-180, lng - deltaLng)
      maxLng = Math.min(180, lng + deltaLng)
    }

    // Fetch cafés with coordinates inside bounding box; limit for safety
    const { data, error } = await supabase
      .from('cafes')
      .select(
        'id, place_id, name, city, latitude, longitude, work_score, ai_score, is_active, created_at'
      )
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .limit(500)

    if (error) {
      console.error('Error fetching cafes for nearby:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cafes' },
        { status: 500 }
      )
    }

    const cafes = (data || []) as CafeRecord[]

    // Compute precise distances from center
    // For bounds queries, we still calculate distance from center but don't filter by radius
    const cafesWithDistance = cafes
      .map((cafe) => {
        const distance = haversineDistance(
          lat,
          lng,
          cafe.latitude || 0,
          cafe.longitude || 0
        )
        return { cafe, distance }
      })
      .filter(({ distance }) => {
        // Only filter by radius if not using bounds (legacy mode)
        if (neLatStr && neLngStr && swLatStr && swLngStr) {
          return true // All cafes in bounds are valid
        }
        return distance <= radius
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50)

    const responseBody = {
      center: { lat, lng },
      radius,
      cafes: cafesWithDistance.map(({ cafe, distance }) => ({
        id: cafe.id,
        place_id: cafe.place_id,
        name: cafe.name,
        lat: cafe.latitude,
        lng: cafe.longitude,
        distance,
        workScore: cafe.work_score ?? cafe.ai_score,
        createdAt: cafe.created_at,
      })),
    }

    const res = NextResponse.json(responseBody, { status: 200 })
    // Basic caching: 60s, keyed by URL (includes rounded lat/lng & radius)
    res.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=60, stale-while-revalidate=120'
    )
    return res
  } catch (err: any) {
    console.error('Error in /api/cafes/nearby:', err)
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 }
    )
  }
}
