/**
 * API endpoint: Fetch cafés near a location filtered by feature
 * Features: wifi, outlets, quiet, time-limit
 * Uses Haversine distance calculation with bounding box pre-filter
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// Mark as dynamic since we use request.url for query params
export const dynamic = 'force-dynamic'

type CafeRecord = {
  id: string
  place_id: string | null
  name: string
  description: string | null
  city: string | null
  state: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  work_score: number | null
  ai_score: number | null
  google_rating: number | null
  google_ratings_total: number | null
  is_work_friendly: boolean | null
  ai_wifi_quality: string | null
  ai_power_outlets: string | null
  ai_noise_level: string | null
  ai_laptop_policy: string | null
  is_verified: boolean | null
  website: string | null
  phone: string | null
  is_active: boolean | null
  created_at: string | null
}

const EARTH_RADIUS_M = 6371000 // meters

/** Haversine distance in meters between two lat/lng pairs */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/**
 * Build feature filter for Supabase query
 */
function buildFeatureFilter(feature: string) {
  switch (feature) {
    case 'wifi':
      return (query: any) =>
        query
          .not('ai_wifi_quality', 'is', null)
          .neq('ai_wifi_quality', 'unknown')
          .neq('ai_wifi_quality', '')
    case 'outlets':
      return (query: any) =>
        query
          .not('ai_power_outlets', 'is', null)
          .neq('ai_power_outlets', 'unknown')
          .neq('ai_power_outlets', '')
    case 'quiet':
      return (query: any) =>
        query.or('ai_noise_level.eq.quiet,ai_noise_level.eq.moderate')
    case 'time-limit':
      return (query: any) =>
        query
          .not('ai_laptop_policy', 'is', null)
          .neq('ai_laptop_policy', 'unknown')
          .neq('ai_laptop_policy', '')
          .ilike('ai_laptop_policy', '%unlimited%')
    default:
      return (query: any) => query
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const latStr = searchParams.get('lat')
    const lngStr = searchParams.get('lng')
    const feature = searchParams.get('feature') || ''
    const radiusStr = searchParams.get('radius') || '5000' // Default 5km
    const limitStr = searchParams.get('limit') || '50'

    // Validate required parameters
    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'lat and lng are required' },
        { status: 400 }
      )
    }

    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    const radius = Math.min(parseInt(radiusStr, 10) || 5000, 20000) // Max 20km
    const limit = Math.min(parseInt(limitStr, 10) || 50, 100) // Max 100

    // Validate ranges
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'lat must be between -90 and 90' },
        { status: 400 }
      )
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'lng must be between -180 and 180' },
        { status: 400 }
      )
    }

    // Validate feature
    const validFeatures = ['wifi', 'outlets', 'quiet', 'time-limit']
    if (!validFeatures.includes(feature)) {
      return NextResponse.json(
        { error: `feature must be one of: ${validFeatures.join(', ')}` },
        { status: 400 }
      )
    }

    // Round lat/lng for cache efficiency (~11m precision)
    const roundedLat = Math.round(lat * 10000) / 10000
    const roundedLng = Math.round(lng * 10000) / 10000

    const supabase = await createClient()

    // Calculate bounding box for pre-filter (performance optimization)
    const angularDistance = radius / EARTH_RADIUS_M // radians
    const deltaLat = (angularDistance * 180) / Math.PI
    const cosLat = Math.max(Math.cos((roundedLat * Math.PI) / 180), 0.1)
    const deltaLng = (angularDistance * 180) / (Math.PI * cosLat)

    const minLat = Math.max(-90, roundedLat - deltaLat)
    const maxLat = Math.min(90, roundedLat + deltaLat)
    const minLng = Math.max(-180, roundedLng - deltaLng)
    const maxLng = Math.min(180, roundedLng + deltaLng)

    // Build query with feature filter
    // Select all fields needed for CafeCard component
    let query = supabase
      .from('cafes')
      .select(
        'id, place_id, name, description, city, state, address, latitude, longitude, work_score, ai_score, google_rating, google_ratings_total, is_work_friendly, ai_wifi_quality, ai_power_outlets, ai_noise_level, ai_laptop_policy, is_verified, website, phone, is_active, created_at'
      )
      .or('is_active.is.null,is_active.eq.true')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)

    // Apply feature filter
    const featureFilter = buildFeatureFilter(feature)
    query = featureFilter(query)

    // Execute query
    const { data, error } = await query.limit(500) // Fetch more than limit for distance filtering

    if (error) {
      console.error('Error fetching cafes for feature:', error)
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
          roundedLat,
          roundedLng,
          cafe.latitude || 0,
          cafe.longitude || 0
        )
        return { cafe, distance }
      })
      .filter(({ distance }) => distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    const responseBody = {
      center: { lat: roundedLat, lng: roundedLng },
      radius,
      feature,
      cafes: cafesWithDistance.map(({ cafe, distance }) => ({
        id: cafe.id,
        place_id: cafe.place_id,
        name: cafe.name,
        description: cafe.description,
        city: cafe.city,
        state: cafe.state,
        address: cafe.address,
        lat: cafe.latitude,
        lng: cafe.longitude,
        distance: Math.round(distance), // Round to meters
        work_score: cafe.work_score ?? cafe.ai_score,
        google_rating: cafe.google_rating,
        google_ratings_total: cafe.google_ratings_total,
        is_work_friendly: cafe.is_work_friendly,
        ai_wifi_quality: cafe.ai_wifi_quality,
        ai_power_outlets: cafe.ai_power_outlets,
        ai_noise_level: cafe.ai_noise_level,
        ai_laptop_policy: cafe.ai_laptop_policy,
        is_verified: cafe.is_verified,
        website: cafe.website,
        phone: cafe.phone,
        created_at: cafe.created_at,
      })),
    }

    const res = NextResponse.json(responseBody, { status: 200 })
    // Cache for 60s (keyed by rounded lat/lng, radius, feature)
    res.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=60, stale-while-revalidate=120'
    )
    return res
  } catch (err: any) {
    console.error('Error in /api/cafes/nearby-feature:', err)
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 }
    )
  }
}
