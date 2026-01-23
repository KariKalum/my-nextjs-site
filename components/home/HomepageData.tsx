import { supabase, type Cafe } from '@/lib/supabase'
import CafeSection from './CafeSection'
import { combineDescription } from '@/lib/utils/description-combiner'

// Mock data fallback - matches new schema
function getMockCafes(): Cafe[] {
  return [
    {
      id: '1',
      place_id: 'ChIJMock1',
      name: 'The Cozy Corner',
      description: 'A quiet café perfect for focused work with excellent WiFi and plenty of outlets.',
      address: '123 Main Street',
      city: 'Berlin',
      state: null,
      zip_code: '10115',
      country: 'DE',
      phone: '+49-30-12345678',
      website: null,
      latitude: 52.52,
      longitude: 13.405,
      google_rating: 4.8,
      google_ratings_total: 127,
      price_level: 2,
      business_status: 'OPERATIONAL',
      hours: { monday: '7am-8pm', tuesday: '7am-8pm' },
      work_score: 8.5,
      is_work_friendly: true,
      ai_confidence: 'high',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

async function getRecentlyAddedCafes(): Promise<Cafe[]> {
  try {
    // Check if Supabase is configured - skip if using placeholder
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.trim() === '') {
      return getMockCafes()
    }

    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      // Check if it's a connection/config error
      if (error.code === 'PGRST116' ||
          error.message?.toLowerCase().includes('invalid') ||
          error.message?.toLowerCase().includes('failed to fetch') ||
          error.message?.toLowerCase().includes('enotfound')) {
        // Use mock data for demo
        return getMockCafes()
      }
      throw error
    }
    
    // Compute descriptionText for each cafe (combines description + ai_inference_notes)
    const cafesWithDescriptionText = (data || []).map((cafe) => ({
      ...cafe,
      descriptionText: combineDescription(cafe.description, cafe.ai_inference_notes)
    }))
    
    return cafesWithDescriptionText
  } catch (error) {
    console.error('Error fetching recently added cafes:', error)
    // Fallback to mock data
    return getMockCafes()
  }
}

async function getTopRatedCafes(): Promise<Cafe[]> {
  try {
    // Check if Supabase is configured - skip if using placeholder
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.trim() === '') {
      return getMockCafes()
    }

    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('is_active', true)
      .order('work_score', { ascending: false, nullsFirst: false })
      .limit(6)

    if (error) {
      // Check if it's a connection/config error
      if (error.code === 'PGRST116' ||
          error.message?.toLowerCase().includes('invalid') ||
          error.message?.toLowerCase().includes('failed to fetch') ||
          error.message?.toLowerCase().includes('enotfound')) {
        // Use mock data for demo
        return getMockCafes()
      }
      throw error
    }
    
    // Compute descriptionText for each cafe (combines description + ai_inference_notes)
    const cafesWithDescriptionText = (data || []).map((cafe) => ({
      ...cafe,
      descriptionText: combineDescription(cafe.description, cafe.ai_inference_notes)
    }))
    
    return cafesWithDescriptionText
  } catch (error) {
    console.error('Error fetching top rated cafes:', error)
    // Fallback to mock data
    return getMockCafes()
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
