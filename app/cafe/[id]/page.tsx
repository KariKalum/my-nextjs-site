import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { supabase, type Cafe } from '@/lib/supabase'
import CafeDetailSEO from '@/components/CafeDetailSEO'
import { combineDescription } from '@/lib/utils/description-combiner'

async function getCafe(id: string): Promise<Cafe | null> {
  try {
    // Check if Supabase is configured - skip if using placeholder
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return null
    }
    
    // Detect param type: Google place_id starts with "ChIJ", otherwise treat as UUID/id
    const queryBy = id.startsWith('ChIJ') ? 'place_id' : 'id'

    // Query public.cafes table - select('*') gets all fields from new schema
    let { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq(queryBy === 'place_id' ? 'place_id' : 'id', id)
      .eq('is_active', true)
      .single()

    // If not found and we queried by id, try place_id as fallback
    if ((error || !data) && queryBy === 'id') {
      const { data: placeData, error: placeError } = await supabase
        .from('cafes')
        .select('*')
        .eq('place_id', id)
        .eq('is_active', true)
        .single()
      
      if (!placeError && placeData) {
        data = placeData
        error = null
      }
    }
      
    // Handle query errors - don't treat as 404
    if (error) {
      console.error('[getCafe] Query error:', error.message)
      return null
    }

    // If no data found, return null (will try mock data)
    if (!data) {
      return null
    }

    // Combine descriptions and add descriptionText
    const descriptionText = combineDescription(
      data.description,
      data.ai_inference_notes
    )

    return { ...data, descriptionText } as Cafe
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
      .select('id, place_id, name, city, address, work_score, google_rating')
      .eq('city', cafe.city)
      .eq('is_active', true)
      .neq('id', cafe.id)
      .order('work_score', { ascending: false, nullsFirst: false })
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

  // Ensure descriptionText is set (for mock data or if somehow missing)
  if (!cafe.descriptionText) {
    cafe.descriptionText = combineDescription(
      cafe.description,
      cafe.ai_inference_notes
    )
  }

  // Fetch nearby cafes for internal linking
  const nearbyCafes = await getNearbyCafes(cafe)

  return <CafeDetailSEO cafe={cafe} nearbyCafes={nearbyCafes} />
}

// Mock data for development/demo - matches new schema
function getMockCafe(id: string): Cafe | null {
  const mockCafes: Record<string, Cafe> = {
    '1': {
      id: '1',
      place_id: 'ChIJMock1',
      name: 'The Cozy Corner',
      description: 'A quiet café perfect for focused work with excellent WiFi and plenty of outlets.',
      ai_inference_notes: 'Great for remote work. Quiet atmosphere with reliable internet.',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      country: 'US',
      phone: '+1-555-0101',
      website: 'https://cozycorner.com',
      latitude: 37.7749,
      longitude: -122.4194,
      google_maps_url: 'https://maps.google.com/?cid=123',
      google_rating: 4.8,
      google_ratings_total: 127,
      price_level: 2,
      business_status: 'OPERATIONAL',
      hours: {
        monday: '7:00 AM - 8:00 PM',
        tuesday: '7:00 AM - 8:00 PM',
        wednesday: '7:00 AM - 8:00 PM',
        thursday: '7:00 AM - 8:00 PM',
        friday: '7:00 AM - 9:00 PM',
        saturday: '8:00 AM - 9:00 PM',
        sunday: '8:00 AM - 7:00 PM',
      },
      work_score: 8.5,
      is_work_friendly: true,
      ai_confidence: 'high',
      ai_wifi_quality: 'Excellent',
      ai_power_outlets: 'Plenty available',
      ai_noise_level: 'Quiet',
      ai_laptop_policy: 'Unlimited',
      is_active: true,
      is_verified: true,
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
