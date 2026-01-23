import { Metadata } from 'next'

export const siteName = 'Café Directory'

/**
 * Get the base URL for the site
 * Uses NEXT_PUBLIC_SITE_URL if available, otherwise defaults to localhost for dev
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // For production deployments, try to infer from Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Default to localhost for development
  return 'http://localhost:3000'
}

/**
 * Build an absolute URL from a path
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = getBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Build a description for a cafe (140-160 chars)
 */
export function buildCafeDescription(cafe: {
  description?: string | null
  wifi_available: boolean
  wifi_speed_rating?: number | null
  power_outlets_available: boolean
  power_outlet_rating?: number | null
  noise_level?: string | null
  time_limit_minutes?: number | null
  google_rating?: number | null
  google_ratings_total?: number | null
  city?: string | null
}): string {
  const parts: string[] = []
  
  // Start with a base description
  let baseDesc = ''
  if (cafe.description) {
    // Use description but keep it concise
    baseDesc = cafe.description.length > 60 ? truncateText(cafe.description, 60) : cafe.description
  } else {
    baseDesc = 'Laptop-friendly café'
  }
  
  // Add key features concisely
  const features: string[] = []
  
  if (cafe.wifi_available) {
    if (cafe.wifi_speed_rating) {
      features.push(`${cafe.wifi_speed_rating}/5 WiFi`)
    } else {
      features.push('WiFi')
    }
  }
  
  if (cafe.power_outlets_available) {
    if (cafe.power_outlet_rating) {
      features.push(`${cafe.power_outlet_rating}/5 outlets`)
    } else {
      features.push('outlets')
    }
  }
  
  if (cafe.noise_level) {
    features.push(cafe.noise_level)
  }
  
  if (cafe.time_limit_minutes && cafe.time_limit_minutes > 0) {
    const hours = Math.floor(cafe.time_limit_minutes / 60)
    const mins = cafe.time_limit_minutes % 60
    if (hours > 0) {
      features.push(`${hours}h limit`)
    } else {
      features.push(`${mins}min limit`)
    }
  } else if (!cafe.time_limit_minutes) {
    features.push('no time limit')
  }
  
  // Build description parts
  parts.push(baseDesc)
  
  if (features.length > 0) {
    parts.push(features.join(', '))
  }
  
  // Add rating if available (keep concise)
  if (cafe.google_rating) {
    const rating = cafe.google_rating.toFixed(1)
    const reviews = cafe.google_ratings_total || 0
    if (reviews > 0 && reviews < 1000) {
      parts.push(`${rating}/5 (${reviews} reviews)`)
    } else if (reviews >= 1000) {
      parts.push(`${rating}/5`)
    } else {
      parts.push(`${rating}/5 rating`)
    }
  }
  
  // Add location context
  if (cafe.city) {
    parts.push(`in ${cafe.city}, Germany`)
  }
  
  let description = parts.join('. ')
  
  // Ensure it's between 140-160 chars
  if (description.length < 140) {
    // Add more context if too short
    if (!description.includes('laptop-friendly') && !description.includes('Laptop-friendly')) {
      description = `Laptop-friendly café. ${description}`
    }
    // If still too short, add working context
    if (description.length < 140) {
      description += '. Perfect for remote work'
    }
  }
  
  // Truncate if too long (target 157 to leave room for ellipsis)
  if (description.length > 160) {
    description = truncateText(description, 157)
  }
  
  return description
}

/**
 * Build OpenGraph image URL for a cafe
 * Returns the first cafe photo if available, otherwise a default image
 */
export async function getCafeOgImage(cafeId: string): Promise<string> {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Check if table exists by attempting query
    const { data, error } = await supabase
      .from('cafe_photos')
      .select('url, thumbnail_url, is_primary')
      .eq('cafe_id', cafeId)
      .eq('is_approved', true)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle()
    
    // If no error and we have data, use the photo
    if (!error && data && (data.url || data.thumbnail_url)) {
      // Use thumbnail if available, otherwise full URL
      const imageUrl = data.thumbnail_url || data.url
      // Reject localhost URLs - return default instead
      if (imageUrl && (imageUrl.includes('127.0.0.1') || imageUrl.includes('localhost'))) {
        return getAbsoluteUrl('/og-default.jpg')
      }
      return imageUrl
    }
  } catch (error: any) {
    // Handle table not found or other errors gracefully
    // PGRST116 = relation does not exist
    if (error?.code !== 'PGRST116' && !error?.message?.includes('does not exist')) {
      console.error('Error fetching cafe photo:', error)
    }
  }
  
  // Return default image path
  return getAbsoluteUrl('/og-default.jpg')
}
