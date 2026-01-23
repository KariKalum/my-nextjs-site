/**
 * Server-side functions for homepage data (Top Rated, Recently Added)
 * Supports limit parameter for mobile (5) vs desktop (10)
 */

import { createClient } from '@/src/lib/supabase/server'
import type { Cafe } from '@/src/lib/supabase/types'
import { combineDescription } from '@/lib/utils/description-combiner'

/**
 * Fetch top rated cafés ordered by work_score
 * Tie-breaker: google_rating (desc), then google_ratings_total (desc)
 */
export async function getTopRatedCafes(limit: number = 10): Promise<Cafe[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .or('is_active.is.null,is_active.eq.true')
    .not('work_score', 'is', null)
    .order('work_score', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false })
    .order('google_ratings_total', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
      console.error('Error fetching top rated cafes:', error)
    }
    return []
  }

  // Compute descriptionText for each cafe
  return (data || []).map((cafe) => ({
    ...cafe,
    descriptionText: combineDescription(cafe.description, cafe.ai_inference_notes),
  })) as Cafe[]
}

/**
 * Fetch recently added cafés ordered by created_at (desc)
 */
export async function getRecentlyAddedCafes(limit: number = 10): Promise<Cafe[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .or('is_active.is.null,is_active.eq.true')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
      console.error('Error fetching recently added cafes:', error)
    }
    return []
  }

  // Compute descriptionText for each cafe
  return (data || []).map((cafe) => ({
    ...cafe,
    descriptionText: combineDescription(cafe.description, cafe.ai_inference_notes),
  })) as Cafe[]
}
