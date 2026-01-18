import { supabase, type Cafe } from '@/lib/supabase'
import CafeSection from './CafeSection'

// Mock data fallback (same as CafeListing)
function getMockCafes(): Cafe[] {
  return [
    {
      id: '1',
      name: 'The Cozy Corner',
      description: 'A quiet café perfect for focused work with excellent WiFi and plenty of outlets.',
      address: '123 Main Street',
      city: 'Berlin',
      state: null,
      zip_code: '10115',
      country: 'DE',
      phone: '+49-30-12345678',
      email: null,
      website: null,
      latitude: 52.52,
      longitude: 13.405,
      wifi_available: true,
      wifi_speed_rating: 5,
      wifi_password_required: true,
      wifi_password: 'cozy2024',
      power_outlets_available: true,
      power_outlet_rating: 5,
      seating_capacity: 30,
      comfortable_seating: true,
      seating_variety: 'tables, couches, bar seating',
      noise_level: 'quiet',
      music_type: 'instrumental',
      conversation_friendly: true,
      table_space_rating: 5,
      natural_light: true,
      lighting_rating: 5,
      hours: { monday: '7am-8pm', tuesday: '7am-8pm' },
      time_limit_minutes: null,
      reservation_required: false,
      laptop_policy: 'unlimited',
      parking_available: true,
      parking_type: 'street',
      accessible: true,
      pet_friendly: false,
      outdoor_seating: true,
      overall_laptop_rating: 4.8,
      total_reviews: 127,
      total_visits: 450,
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Brew & Code',
      description: 'Tech-focused café with high-speed WiFi, multiple outlets, and great coffee.',
      address: '456 Tech Avenue',
      city: 'Munich',
      state: null,
      zip_code: '80331',
      country: 'DE',
      phone: '+49-89-98765432',
      email: null,
      website: null,
      latitude: 48.1351,
      longitude: 11.582,
      wifi_available: true,
      wifi_speed_rating: 5,
      wifi_password_required: false,
      wifi_password: null,
      power_outlets_available: true,
      power_outlet_rating: 4,
      seating_capacity: 40,
      comfortable_seating: true,
      seating_variety: 'standing desks, tables, couches',
      noise_level: 'moderate',
      music_type: 'electronic',
      conversation_friendly: true,
      table_space_rating: 4,
      natural_light: false,
      lighting_rating: 4,
      hours: { monday: '6am-10pm' },
      time_limit_minutes: null,
      reservation_required: false,
      laptop_policy: 'unlimited',
      parking_available: false,
      parking_type: null,
      accessible: true,
      pet_friendly: true,
      outdoor_seating: false,
      overall_laptop_rating: 4.6,
      total_reviews: 89,
      total_visits: 320,
      is_active: true,
      is_verified: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

async function getRecentlyAddedCafes(): Promise<Cafe[]> {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      // Check if it's a connection/config error
      if (error.message?.includes('placeholder') || 
          error.code === 'PGRST116' ||
          error.message?.toLowerCase().includes('invalid') ||
          error.message?.toLowerCase().includes('failed to fetch')) {
        // Use mock data for demo
        return getMockCafes()
      }
      throw error
    }
    return data && data.length > 0 ? data : []
  } catch (error) {
    console.error('Error fetching recently added cafes:', error)
    // Fallback to mock data
    return getMockCafes()
  }
}

async function getTopRatedCafes(): Promise<Cafe[]> {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('is_active', true)
      .order('overall_laptop_rating', { ascending: false })
      .limit(6)

    if (error) {
      // Check if it's a connection/config error
      if (error.message?.includes('placeholder') || 
          error.code === 'PGRST116' ||
          error.message?.toLowerCase().includes('invalid') ||
          error.message?.toLowerCase().includes('failed to fetch')) {
        // Use mock data for demo
        return getMockCafes()
      }
      throw error
    }
    return data && data.length > 0 ? data : []
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
        cafes={recentlyAdded}
        emptyMessage="No cafés have been added yet. Be the first to add one!"
        viewAllLink="/cities"
      />
      <CafeSection
        title="Top Rated to Work From"
        cafes={topRated}
        emptyMessage="No cafés have been rated yet."
        viewAllLink="/cities"
      />
    </>
  )
}
