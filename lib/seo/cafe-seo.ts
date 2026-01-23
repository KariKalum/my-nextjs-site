import type { Cafe } from '@/src/lib/supabase/types'
import { formatWorkScore } from '@/lib/utils/cafe-formatters'
import { getAbsoluteUrl } from './metadata'

/**
 * Extract street/area from full address
 * Examples:
 * "123 Main Street, Berlin" -> "Main Street"
 * "Rosenthaler Str. 123, Berlin" -> "Rosenthaler Str."
 * "456 Tech Avenue, San Francisco" -> "Tech Avenue"
 */
export function extractStreetFromAddress(address: string | null): string | null {
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
 * Build SEO-friendly title for cafe page (for <title> tag).
 * Format: {Cafe Name} — {Label} in {City}
 * No street address, no parentheses.
 */
export function buildCafeTitle(cafe: Cafe): string {
  const city = cafe.city || 'Germany'
  
  // Determine work-friendly label
  const workFriendlyLabel = cafe.is_work_friendly === true 
    ? 'Laptop-friendly cafe' 
    : 'Coworking-friendly cafe'
  
  return `${cafe.name} — ${workFriendlyLabel} in ${city}`
}

/**
 * Build meta description for cafe (140-160 chars)
 */
export function buildCafeMetaDescription(cafe: Cafe): string {
  const parts: string[] = []
  
  // Start with work score if available
  if (cafe.work_score != null) {
    const formatted = formatWorkScore(cafe.work_score)
    if (formatted) {
      parts.push(`Work score: ${formatted}`)
    }
  } else if (cafe.google_rating != null) {
    parts.push(`${cafe.google_rating.toFixed(1)}/5 rating`)
  }
  
  // Add WiFi info (using ai_wifi_quality)
  if (cafe.ai_wifi_quality) {
    parts.push(`WiFi: ${cafe.ai_wifi_quality}`)
  }
  
  // Add power outlets (using ai_power_outlets)
  if (cafe.ai_power_outlets) {
    parts.push(`Outlets: ${cafe.ai_power_outlets}`)
  }
  
  // Add noise level (using ai_noise_level)
  if (cafe.ai_noise_level) {
    parts.push(`${cafe.ai_noise_level} atmosphere`)
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
