import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

type CafeRecord = {
  id: string
  name: string
  city: string | null
  latitude: number | null
  longitude: number | null
  wifi_available: boolean
  wifi_speed_rating: number | null
  power_outlets_available: boolean
  power_outlet_rating: number | null
  noise_level: string | null
  time_limit_minutes: number | null
  overall_laptop_rating: number | null
  is_active: boolean
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

    let lat = parseFloat(latStr)
    let lng = parseFloat(lngStr)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: 'lat and lng are required and must be numbers' },
        { status: 400 }
      )
    }

    // Validate ranges
    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'lat must be between -90 and 90' },
        { status: 400 }
      )
    }
    if (lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'lng must be between -180 and 180' },
        { status: 400 }
      )
    }

    // Radius: default 2000, clamp to max 10000
    let radius = parseInt(radiusStr || '2000', 10)
    if (Number.isNaN(radius)) radius = 2000
    radius = Math.min(radius, 10000)

    // Round lat/lng slightly to improve cache hit rate (~11m precision)
    lat = Math.round(lat * 10000) / 10000
    lng = Math.round(lng * 10000) / 10000

    const supabase = await createClient()

    // Bounding box pre-filter (simple, not using geo index yet)
    const angularDistance = radius / EARTH_RADIUS_M // radians
    const deltaLat = (angularDistance * 180) / Math.PI
    const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.1) // avoid division by zero
    const deltaLng = (angularDistance * 180) / (Math.PI * cosLat)

    const minLat = Math.max(-90, lat - deltaLat)
    const maxLat = Math.min(90, lat + deltaLat)
    const minLng = Math.max(-180, lng - deltaLng)
    const maxLng = Math.min(180, lng + deltaLng)

    // Fetch cafés with coordinates inside bounding box; limit for safety
    const { data, error } = await supabase
      .from('cafes')
      .select(
        'id, name, city, latitude, longitude, wifi_available, wifi_speed_rating, power_outlets_available, power_outlet_rating, noise_level, time_limit_minutes, overall_laptop_rating, is_active'
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

    // Compute precise distances and filter by radius
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
      .filter(({ distance }) => distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50)

    const responseBody = {
      center: { lat, lng },
      radius,
      cafes: cafesWithDistance.map(({ cafe, distance }) => ({
        id: cafe.id,
        name: cafe.name,
        lat: cafe.latitude,
        lng: cafe.longitude,
        distance,
        wifi: {
          available: cafe.wifi_available,
          speedRating: cafe.wifi_speed_rating,
        },
        outlets: {
          available: cafe.power_outlets_available,
          rating: cafe.power_outlet_rating,
        },
        noise: cafe.noise_level,
        timeLimit: cafe.time_limit_minutes,
        rating: cafe.overall_laptop_rating,
        // No slug column in schema yet; use id as slug-compatible value
        slug: cafe.id,
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
