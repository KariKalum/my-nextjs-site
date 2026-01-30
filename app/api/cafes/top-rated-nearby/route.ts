/**
 * GET /api/cafes/top-rated-nearby?lat=&lng=&radius=&limit=
 * Returns full cafe records near a point, sorted by Workscore (desc) then distance (asc).
 * Used by the "Top Rated to Work From" section when user location is available.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import type { Cafe } from '@/src/lib/supabase/types'

export const dynamic = 'force-dynamic'

const EARTH_RADIUS_M = 6371000 // meters
const DEFAULT_RADIUS = 50000 // 50 km
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 20

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
    const latStr = searchParams.get('lat') ?? ''
    const lngStr = searchParams.get('lng') ?? ''
    const radius = Math.min(
      Math.max(parseInt(searchParams.get('radius') ?? String(DEFAULT_RADIUS), 10) || DEFAULT_RADIUS, 1000),
      100000
    )
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    )

    if (!latStr || !lngStr) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
    }

    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Invalid lat or lng' }, { status: 400 })
    }

    const angularDistance = radius / EARTH_RADIUS_M
    const deltaLat = (angularDistance * 180) / Math.PI
    const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.1)
    const deltaLng = (angularDistance * 180) / (Math.PI * cosLat)
    const minLat = Math.max(-90, lat - deltaLat)
    const maxLat = Math.min(90, lat + deltaLat)
    const minLng = Math.max(-180, lng - deltaLng)
    const maxLng = Math.min(180, lng + deltaLng)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .or('is_active.is.null,is_active.eq.true')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .limit(200)

    if (error) {
      console.error('Error fetching top-rated-nearby:', error)
      return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 })
    }

    const cafes = (data ?? []) as Cafe[]
    const withDistance = cafes
      .map((cafe) => ({
        cafe,
        distance: haversineDistance(lat, lng, cafe.latitude ?? 0, cafe.longitude ?? 0),
      }))
      .filter(({ distance }) => distance <= radius)
    // Sort: Workscore descending (primary), then distance ascending (secondary)
    withDistance.sort((a, b) => {
      const wsA = a.cafe.work_score ?? a.cafe.ai_score ?? 0
      const wsB = b.cafe.work_score ?? b.cafe.ai_score ?? 0
      if (wsB !== wsA) return wsB - wsA
      return a.distance - b.distance
    })
    const top = withDistance.slice(0, limit).map(({ cafe, distance }) => ({ ...cafe, distance }))

    return NextResponse.json({ cafes: top }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (err: unknown) {
    console.error('Error in /api/cafes/top-rated-nearby:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
