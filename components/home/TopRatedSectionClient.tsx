'use client'

import { useState, useEffect } from 'react'
import type { Cafe } from '@/src/lib/supabase/types'
import CafeSectionClient from './CafeSectionClient'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/getDictionary'

const TOP_RATED_NEARBY_RADIUS = 50000 // 50 km
const TOP_RATED_NEARBY_LIMIT = 10

interface TopRatedSectionClientProps {
  initialCafes: Cafe[]
  title: string
  description?: string
  emptyMessage?: string
  viewAllLink?: string
  locale: Locale
  dict?: Dictionary
}

/**
 * "Top Rated to Work From" section: default Berlin (Workscore-sorted), or near user when location granted.
 * Sort rule: Workscore > proximity > everything else. No new CTAs; uses location independently.
 */
export default function TopRatedSectionClient({
  initialCafes,
  title,
  description,
  emptyMessage,
  viewAllLink,
  locale,
  dict,
}: TopRatedSectionClientProps) {
  const [cafes, setCafes] = useState<Cafe[]>(initialCafes)

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `/api/cafes/top-rated-nearby?lat=${latitude}&lng=${longitude}&radius=${TOP_RATED_NEARBY_RADIUS}&limit=${TOP_RATED_NEARBY_LIMIT}`
          )
          if (!res.ok) return
          const data = await res.json()
          if (data.cafes?.length > 0) {
            setCafes(data.cafes)
          }
        } catch {
          // Keep initial (Berlin) on error
        }
      },
      () => {
        // Permission denied or error: keep initial Berlin list
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  return (
    <CafeSectionClient
      title={title}
      description={description}
      cafes={cafes}
      emptyMessage={emptyMessage}
      viewAllLink={viewAllLink}
      locale={locale}
      dict={dict}
    />
  )
}
