/**
 * Intent-based filtering for city/district pages.
 * Used by /cities/[city]/work, /cities/[city]/laptop-friendly, /cities/berlin/[district]/work.
 */

import type { Cafe } from '@/src/lib/supabase/types'

/** Intent variant for SEO landing pages; undefined = default (no extra filter). */
export type Intent = 'work' | 'laptop-friendly' | undefined

// ---------------------------------------------------------------------------
// Thresholds (tunable; keep conservative to avoid empty results)
// ---------------------------------------------------------------------------

/** Minimum work_score to include when is_work_friendly is null/unknown (work intent). */
export const WORK_SCORE_THRESHOLD_WORK = 6.5

/** Minimum work_score for laptop-friendly fallback (wifi + outlets + score). */
export const WORK_SCORE_THRESHOLD_LAPTOP = 6.0

/** Consider policy "present" if not one of these (laptop-friendly intent). */
const UNKNOWN_POLICY_VALUES = ['unknown', '']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasWifi(cafe: Cafe): boolean {
  const v = cafe.ai_wifi_quality
  return typeof v === 'string' && v.trim() !== '' && v.toLowerCase() !== 'unknown'
}

function hasOutlets(cafe: Cafe): boolean {
  const v = cafe.ai_power_outlets
  return typeof v === 'string' && v.trim() !== '' && v.toLowerCase() !== 'unknown'
}

function hasLaptopPolicy(cafe: Cafe): boolean {
  const v = cafe.ai_laptop_policy
  return typeof v === 'string' && v.trim() !== '' && !UNKNOWN_POLICY_VALUES.includes(v.toLowerCase().trim())
}

function workScoreAtLeast(cafe: Cafe, threshold: number): boolean {
  const score = cafe.work_score ?? cafe.ai_score
  return typeof score === 'number' && !Number.isNaN(score) && score >= threshold
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Filter cafes by intent. When intent is undefined, returns the same array (no filter).
 * Dev sanity: filterCafesByIntent(cafes, undefined) === cafes (same reference).
 *
 * Rules:
 * - work:
 *   Include if is_work_friendly === true.
 *   Else include if work_score >= WORK_SCORE_THRESHOLD_WORK when is_work_friendly is null/unknown.
 * - laptop-friendly:
 *   Include if ai_laptop_policy is present and not 'unknown' and not empty.
 *   OR (ai_wifi_quality present AND ai_power_outlets present AND work_score >= WORK_SCORE_THRESHOLD_LAPTOP).
 *   Conservative to avoid empty results.
 */
export function filterCafesByIntent(cafes: Cafe[], intent: Intent): Cafe[] {
  if (!Array.isArray(cafes)) return []
  if (intent === undefined) return cafes

  if (intent === 'work') {
    return cafes.filter((cafe) => {
      if (!cafe || typeof cafe !== 'object') return false
      if (cafe.is_work_friendly === true) return true
      if (cafe.is_work_friendly === false) return false
      return workScoreAtLeast(cafe, WORK_SCORE_THRESHOLD_WORK)
    })
  }

  if (intent === 'laptop-friendly') {
    return cafes.filter((cafe) => {
      if (!cafe || typeof cafe !== 'object') return false
      if (hasLaptopPolicy(cafe)) return true
      return hasWifi(cafe) && hasOutlets(cafe) && workScoreAtLeast(cafe, WORK_SCORE_THRESHOLD_LAPTOP)
    })
  }

  return cafes
}
