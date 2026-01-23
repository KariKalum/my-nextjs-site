import { supabase, type Cafe } from '@/lib/supabase'
import CafeSection from './CafeSection'
import { combineDescription } from '@/lib/utils/description-combiner'

async function getRecentlyAddedCafes(): Promise<Cafe[]> {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      console.error('Error fetching recently added cafes:', error)
      return []
    }
    
    // Compute descriptionText for each cafe (combines description + ai_inference_notes)
    const cafesWithDescriptionText = (data || []).map((cafe) => ({
      ...cafe,
      descriptionText: combineDescription(cafe.description, cafe.ai_inference_notes)
    }))
    
    return cafesWithDescriptionText
  } catch (error) {
    console.error('Error fetching recently added cafes:', error)
    return []
  }
}

async function getTopRatedCafes(): Promise<Cafe[]> {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('is_active', true)
      .order('work_score', { ascending: false, nullsFirst: false })
      .limit(6)

    if (error) {
      console.error('Error fetching top rated cafes:', error)
      return []
    }
    
    // Compute descriptionText for each cafe (combines description + ai_inference_notes)
    const cafesWithDescriptionText = (data || []).map((cafe) => ({
      ...cafe,
      descriptionText: combineDescription(cafe.description, cafe.ai_inference_notes)
    }))
    
    return cafesWithDescriptionText
  } catch (error) {
    console.error('Error fetching top rated cafes:', error)
    return []
  }
}

export default async function HomepageData() {
  const [recentlyAdded, topRated] = await Promise.all([
    getRecentlyAddedCafes(),
    getTopRatedCafes(),
  ])

  return (
    <>
      <CafeSection
        title="Recently Added"
        description="Discover the newest laptop-friendly cafés added to our directory"
        cafes={recentlyAdded}
        emptyMessage="No cafés have been added yet. Be the first to add one!"
        viewAllLink="/cities"
      />
      <CafeSection
        title="Top Rated to Work From"
        description="Highest-rated cafés for productive remote work based on user reviews"
        cafes={topRated}
        emptyMessage="No cafés have been rated yet."
        viewAllLink="/cities"
      />
    </>
  )
}
