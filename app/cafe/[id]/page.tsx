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

    // If no data found, return null
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
  const cafe = await getCafe(params.id)



  if (!cafe) {
    notFound()
  }

  // Ensure descriptionText is set (combines description + ai_inference_notes)
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


// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const cafe = await getCafe(params.id)
  
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
