import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { supabase, type Cafe } from '@/lib/supabase'
import CafeDetailSEO from '@/components/CafeDetailSEO'

async function getCafe(id: string): Promise<Cafe | null> {
  try {
    // Check if Supabase is configured - skip if using placeholder
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return null
    }

    // Try to fetch by id first
    let { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    // If not found, try to fetch by place_id
    if (error || !data) {
      const { data: placeData, error: placeError } = await supabase
        .from('cafes')
        .select('*')
        .eq('place_id', id)
        .eq('is_active', true)
        .single()
      
      if (!placeError && placeData) {
        return placeData as Cafe
      }
    }

    if (error || !data) {
      return null
    }

    return data as Cafe
  } catch (error) {
    console.error('Error fetching cafe:', error)
    return null
  }
}

async function getNearbyCafes(cafe: Cafe, limit: number = 3): Promise<Cafe[]> {
  try {
    // Check if Supabase is configured - skip if using placeholder
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return []
    }

    if (!cafe.latitude || !cafe.longitude || !cafe.city) {
      return []
    }

    // Fetch cafes in the same city (excluding current cafe)
    const { data, error } = await supabase
      .from('cafes')
      .select('id, name, city, address, overall_laptop_rating')
      .eq('city', cafe.city)
      .eq('is_active', true)
      .neq('id', cafe.id)
      .order('overall_laptop_rating', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data as Cafe[]
  } catch (error) {
    console.error('Error fetching nearby cafes:', error)
    return []
  }
}

export default async function CafeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  let cafe = await getCafe(params.id)

  // If not found in database, try mock data for demo
  if (!cafe) {
    cafe = getMockCafe(params.id)
  }

  if (!cafe) {
    notFound()
  }

  // Fetch nearby cafes for internal linking
  const nearbyCafes = await getNearbyCafes(cafe)

  return <CafeDetailSEO cafe={cafe} nearbyCafes={nearbyCafes} />
}

// Mock data for development/demo
function getMockCafe(id: string): Cafe | null {
  const mockCafes: Record<string, Cafe> = {
    '1': {
      id: '1',
      name: 'The Cozy Corner',
      description: 'A quiet café perfect for focused work with excellent WiFi and plenty of outlets. Features comfortable seating, natural lighting, and a welcoming atmosphere for remote workers.',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      country: 'US',
      phone: '+1-555-0101',
      email: 'info@cozycorner.com',
      website: 'https://cozycorner.com',
      latitude: 37.7749,
      longitude: -122.4194,
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
      hours: {
        monday: '7:00 AM - 8:00 PM',
        tuesday: '7:00 AM - 8:00 PM',
        wednesday: '7:00 AM - 8:00 PM',
        thursday: '7:00 AM - 8:00 PM',
        friday: '7:00 AM - 9:00 PM',
        saturday: '8:00 AM - 9:00 PM',
        sunday: '8:00 AM - 7:00 PM',
      },
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
    '2': {
      id: '2',
      name: 'Brew & Code',
      description: 'Tech-focused café with high-speed WiFi, multiple outlets, and great coffee. Perfect for developers and digital nomads.',
      address: '456 Tech Avenue',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94103',
      country: 'US',
      phone: '+1-555-0102',
      email: null,
      website: 'https://brewandcode.com',
      latitude: 37.7849,
      longitude: -122.4094,
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
      hours: { monday: '6:00 AM - 10:00 PM' },
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    '3': {
      id: '3',
      name: 'Quiet Hours Café',
      description: 'Silent workspace café with dedicated quiet zones and excellent lighting.',
      address: '789 Peace Street',
      city: 'Oakland',
      state: 'CA',
      zip_code: '94601',
      country: 'US',
      phone: '+1-555-0103',
      email: null,
      website: null,
      latitude: 37.8044,
      longitude: -122.2712,
      wifi_available: true,
      wifi_speed_rating: 4,
      wifi_password_required: true,
      wifi_password: 'quiet123',
      power_outlets_available: true,
      power_outlet_rating: 3,
      seating_capacity: 25,
      comfortable_seating: true,
      seating_variety: 'tables, armchairs',
      noise_level: 'quiet',
      music_type: null,
      conversation_friendly: false,
      table_space_rating: 5,
      natural_light: true,
      lighting_rating: 5,
      hours: { monday: '8:00 AM - 6:00 PM' },
      time_limit_minutes: 240,
      reservation_required: false,
      laptop_policy: 'peak hours only',
      parking_available: true,
      parking_type: 'lot',
      accessible: true,
      pet_friendly: false,
      outdoor_seating: false,
      overall_laptop_rating: 4.5,
      total_reviews: 56,
      total_visits: 180,
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    '4': {
      id: '4',
      name: 'Social Workspace',
      description: 'Vibrant café with good WiFi but limited outlets. Great for meetings and collaboration.',
      address: '321 Community Blvd',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94104',
      country: 'US',
      phone: '+1-555-0104',
      email: null,
      website: null,
      latitude: 37.7649,
      longitude: -122.4294,
      wifi_available: true,
      wifi_speed_rating: 3,
      wifi_password_required: false,
      wifi_password: null,
      power_outlets_available: true,
      power_outlet_rating: 2,
      seating_capacity: 50,
      comfortable_seating: true,
      seating_variety: 'tables, couches, communal seating',
      noise_level: 'loud',
      music_type: 'varied',
      conversation_friendly: true,
      table_space_rating: 3,
      natural_light: true,
      lighting_rating: 4,
      hours: { monday: '7:00 AM - 9:00 PM' },
      time_limit_minutes: 180,
      reservation_required: false,
      laptop_policy: 'restricted',
      parking_available: false,
      parking_type: null,
      accessible: false,
      pet_friendly: true,
      outdoor_seating: true,
      overall_laptop_rating: 3.2,
      total_reviews: 43,
      total_visits: 150,
      is_active: true,
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  }

  return mockCafes[id] || null
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  let cafe = await getCafe(params.id)
  
  // Try mock data if not found in database
  if (!cafe) {
    cafe = getMockCafe(params.id)
  }
  
  if (!cafe) {
    const { siteName, getAbsoluteUrl } = await import('@/lib/seo/metadata')
    return {
      title: `Café not found | ${siteName}`,
      description: 'The café you are looking for could not be found.',
      openGraph: {
        title: `Café not found | ${siteName}`,
        description: 'The café you are looking for could not be found.',
        type: 'website',
        siteName,
      },
      alternates: {
        canonical: getAbsoluteUrl(`/cafe/${params.id}`),
      },
    }
  }
  
  // Import SEO helpers
  const { 
    siteName, 
    getAbsoluteUrl, 
    getCafeOgImage 
  } = await import('@/lib/seo/metadata')
  
  const {
    buildCafeTitle,
    buildCafeMetaDescription,
  } = await import('@/lib/seo/cafe-seo')
  
  // Build SEO-optimized title
  const title = buildCafeTitle(cafe)
  const fullTitle = `${title} | ${siteName}`
  
  // Build description (140-160 chars)
  const description = buildCafeMetaDescription(cafe)
  
  // Get canonical URL (use place_id if available, otherwise id)
  const canonicalId = cafe.place_id || params.id
  const canonicalUrl = getAbsoluteUrl(`/cafe/${canonicalId}`)
  
  // Get OG image
  const ogImage = await getCafeOgImage(cafe.id)
  
  // Determine locale (default to 'en' but can be enhanced)
  const locale = 'en_US'
  
  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName,
      locale,
      images: ogImage ? [
        {
          url: ogImage,
          alt: `${cafe.name} - ${cafe.city ? `Laptop-friendly café in ${cafe.city}` : 'Cafe'}`,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}
