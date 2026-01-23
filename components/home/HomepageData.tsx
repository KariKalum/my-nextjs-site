import type { Cafe } from '@/src/lib/supabase/types'
import CafeSectionClient from './CafeSectionClient'
import { getTopRatedCafes, getRecentlyAddedCafes } from '@/src/lib/cafes/homepage'

/**
 * HomepageData component
 * Fetches and displays Top Rated and Recently Added sections
 * 
 * Fetches 10 items per section (client component slices to 5 for mobile)
 * Sections are reordered: Top Rated first, then Recently Added
 */
export default async function HomepageData() {
  // Fetch 10 items each (client component will slice to 5 for mobile)
  const [topRated, recentlyAdded] = await Promise.all([
    getTopRatedCafes(10),
    getRecentlyAddedCafes(10),
  ])

  return (
    <>
      {/* Top Rated first (reordered) */}
      <CafeSectionClient
        title="Top Rated to Work From"
        description="Highest-rated cafés for productive remote work based on user reviews"
        cafes={topRated}
        emptyMessage="No cafés have been rated yet."
        viewAllLink="/cities"
      />
      {/* Recently Added second */}
      <CafeSectionClient
        title="Recently Added"
        description="Discover the newest laptop-friendly cafés added to our directory"
        cafes={recentlyAdded}
        emptyMessage="No cafés have been added yet. Be the first to add one!"
        viewAllLink="/cities"
      />
    </>
  )
}
