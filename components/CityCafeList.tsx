'use client'

import { useState, useMemo } from 'react'
import type { Cafe } from '@/src/lib/supabase/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import CafeCard from '@/components/CafeCard'

interface CityCafeListProps {
  cafes: Cafe[]
  cityName: string
  locale: Locale
  dict: Dictionary
}

export default function CityCafeList({
  cafes,
  cityName,
  locale,
  dict,
}: CityCafeListProps) {
  // Runtime guard: ensure cafes is always an array
  const safeCafes = Array.isArray(cafes) ? cafes : []
  const [showAll, setShowAll] = useState(false)

  // Sort by work_score DESC (for collapsed view - top 10)
  const cafesByWorkScore = useMemo(() => {
    if (safeCafes.length === 0) return []
    return [...safeCafes].sort((a, b) => {
      const aScore = a.work_score ?? 0
      const bScore = b.work_score ?? 0
      return bScore - aScore
    })
  }, [cafes])

  // Sort by rating DESC, then reviewCount DESC, then workScore DESC (for expanded view)
  const cafesByRating = useMemo(() => {
    if (safeCafes.length === 0) return []
    return [...safeCafes].sort((a, b) => {
      // Primary: rating (google_rating)
      const aRating = a.google_rating ?? 0
      const bRating = b.google_rating ?? 0
      if (bRating !== aRating) {
        return bRating - aRating
      }

      // Tie-breaker 1: reviewCount (google_ratings_total)
      const aReviews = a.google_ratings_total ?? 0
      const bReviews = b.google_ratings_total ?? 0
      if (bReviews !== aReviews) {
        return bReviews - aReviews
      }

      // Tie-breaker 2: workScore
      const aScore = a.work_score ?? 0
      const bScore = b.work_score ?? 0
      return bScore - aScore
    })
  }, [safeCafes])

  // Determine visible cafés based on state
  const visibleCafes = useMemo(() => {
    if (showAll) {
      return cafesByRating
    } else {
      return cafesByWorkScore.slice(0, 10)
    }
  }, [showAll, cafesByWorkScore, cafesByRating])

  const totalCount = safeCafes.length
  
  // Early return if no cafes (should be handled by SearchResults, but guard here too)
  if (totalCount === 0) {
    return null
  }
  const visibleCount = visibleCafes.length

  return (
    <section>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-600">
          {showAll
            ? tmpl(t(dict, 'city.showingAll'), { total: String(totalCount) })
            : tmpl(t(dict, 'city.showingCount'), {
                count: String(visibleCount),
                total: String(totalCount),
              })}
        </p>
        {totalCount > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            {showAll
              ? t(dict, 'city.showTop10')
              : tmpl(t(dict, 'city.showAll'), { city: cityName })}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} locale={locale} dict={dict} />
        ))}
      </div>
    </section>
  )
}
