import type { Cafe } from '@/lib/supabase'
import { getAbsoluteUrl } from './metadata'

/**
 * Extract street/area from full address
 * Examples:
 * "123 Main Street, Berlin" -> "Main Street"
 * "Rosenthaler Str. 123, Berlin" -> "Rosenthaler Str."
 * "456 Tech Avenue, San Francisco" -> "Tech Avenue"
 */
export function extractStreetFromAddress(address: string): string | null {
  if (!address) return null
  
  // Remove city, state, zip, country suffixes
  const cleaned = address
    .replace(/\s*,\s*[^,]+$/, '') // Remove last comma-separated part (usually city)
    .replace(/\s+\d{5,}/, '') // Remove zip codes
    .trim()
  
  // Extract street name (everything after the first number if present)
  const match = cleaned.match(/^\d+\s+(.+)$/)
  if (match) {
    return match[1]
  }
  
  // If no number prefix, return the cleaned address
  return cleaned || null
}

/**
 * Build SEO-friendly title for cafe page
 */
export function buildCafeTitle(cafe: Cafe): string {
  const city = cafe.city || 'Germany'
  const street = extractStreetFromAddress(cafe.address)
  const streetPart = street ? ` (${street})` : ''
  
  // Use is_work_friendly if available, otherwise default to true based on work_score
  const isWorkFriendly = cafe.is_work_friendly !== false && 
    (cafe.is_work_friendly === true || cafe.work_score !== null || cafe.overall_laptop_rating !== null)
  
  const workFriendlyPart = isWorkFriendly ? 'Laptop-friendly' : ''
  
  if (workFriendlyPart) {
    return `${cafe.name} — ${workFriendlyPart} cafe in ${city}${streetPart}`
  }
  
  return `${cafe.name} — Cafe in ${city}${streetPart}`
}

/**
 * Build meta description for cafe (140-160 chars)
 */
export function buildCafeMetaDescription(cafe: Cafe): string {
  const parts: string[] = []
  
  // Start with work score or rating if available
  if (cafe.work_score !== null && cafe.work_score !== undefined) {
    parts.push(`Work score: ${cafe.work_score}/10`)
  } else if (cafe.overall_laptop_rating) {
    parts.push(`${cafe.overall_laptop_rating.toFixed(1)}/5 laptop rating`)
  }
  
  // Add WiFi info
  if (cafe.wifi_available) {
    if (cafe.wifi_speed_rating) {
      parts.push(`${cafe.wifi_speed_rating}/5 WiFi`)
    } else {
      parts.push('Free WiFi')
    }
  }
  
  // Add power outlets
  if (cafe.power_outlets_available) {
    if (cafe.power_outlet_rating) {
      parts.push(`${cafe.power_outlet_rating}/5 outlets`)
    } else {
      parts.push('Power outlets')
    }
  }
  
  // Add noise level
  if (cafe.noise_level) {
    parts.push(`${cafe.noise_level} atmosphere`)
  }
  
  // Add address
  const cityState = [cafe.city, cafe.state].filter(Boolean).join(', ')
  if (cityState) {
    parts.push(`Located in ${cityState}`)
  }
  
  let description = parts.join('. ')
  
  // Ensure it's between 140-160 chars
  if (description.length < 140) {
    // Add more context if too short
    if (cafe.description && description.length < 120) {
      const shortDesc = cafe.description.slice(0, 40)
      description = `${shortDesc}. ${description}`
    }
  }
  
  // Truncate if too long
  if (description.length > 160) {
    description = description.slice(0, 157) + '...'
  }
  
  return description || `Discover ${cafe.name}, a cafe in ${cafe.city || 'Germany'}.`
}
