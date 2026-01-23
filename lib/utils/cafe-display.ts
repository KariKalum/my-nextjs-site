import type { Cafe } from '@/lib/supabase'

/**
 * Format address line without duplication.
 * Detects if address already contains city/zip/country and only appends missing parts.
 */
export function formatAddress(data: {
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
}): string {
  if (!data.address || !data.address.trim()) {
    // If no address, try to build from available parts
    const parts: string[] = []
    if (data.zip_code) parts.push(data.zip_code)
    if (data.city) parts.push(data.city)
    if (data.state) parts.push(data.state)
    if (data.country) parts.push(data.country)
    return parts.filter(Boolean).join(', ') || ''
  }

  let address = data.address.trim()
  const addressLower = address.toLowerCase()

  // Check what's already in the address
  const hasCity = data.city && addressLower.includes(data.city.toLowerCase())
  const hasZip = data.zip_code && addressLower.includes(data.zip_code)
  const hasState = data.state && addressLower.includes(data.state.toLowerCase())
  const hasCountry = data.country && addressLower.includes(data.country.toLowerCase())

  // Build parts to append (only missing ones)
  const partsToAppend: string[] = []

  // Append zip_code if missing (before city)
  if (data.zip_code && !hasZip) {
    partsToAppend.push(data.zip_code)
  }

  // Append city if missing
  if (data.city && !hasCity) {
    partsToAppend.push(data.city)
  }

  // Append state if missing
  if (data.state && !hasState) {
    partsToAppend.push(data.state)
  }

  // Append country if missing
  if (data.country && !hasCountry) {
    partsToAppend.push(data.country)
  }

  // Combine address with missing parts
  if (partsToAppend.length > 0) {
    return `${address}, ${partsToAppend.join(', ')}`
  }

  // Address already contains everything, return as-is
  return address
}

/**
 * Build a single address line from cafe fields (legacy - use formatAddress instead).
 * No duplicates — use only in header.
 */
export function formatAddressLine(cafe: {
  address: string
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
}): string {
  return formatAddress(cafe)
}

/**
 * Strip URL to clean domain only (no protocol, no www).
 * e.g. "https://www.example.com/path" -> "example.com"
 */
export function stripWebsiteDomain(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    let host = u.hostname.replace(/^www\./, '')
    return host || null
  } catch {
    return null
  }
}

/**
 * Clean domain from URL: strips protocol and trailing slash.
 * Returns domain + path if needed, but prefer domain only.
 * e.g. "https://www.example.com/path/" -> "example.com/path"
 *      "https://example.com/" -> "example.com"
 */
export function cleanDomain(url: string): string {
  if (!url || typeof url !== 'string') return ''
  
  // Remove protocol
  let cleaned = url.replace(/^https?:\/\//i, '')
  
  // Remove trailing slash
  cleaned = cleaned.replace(/\/$/, '')
  
  // Remove www. prefix
  cleaned = cleaned.replace(/^www\./i, '')
  
  return cleaned
}

/**
 * Extract street-level address (street name + number) from full address.
 * Removes city, state, zip_code, country.
 * Examples:
 * "Nagelsweg 19, 20459 Hamburg, Germany" -> "Nagelsweg 19"
 * "Venusberg 26, 20459 Hamburg" -> "Venusberg 26"
 * "123 Main Street, San Francisco, CA 94102" -> "123 Main Street"
 */
export function extractStreetAddress(
  address: string,
  city?: string | null,
  state?: string | null,
  zip_code?: string | null,
  country?: string | null
): string | null {
  if (!address || typeof address !== 'string') return null
  
  let street = address.trim()
  
  // Remove city if it appears at the end
  if (city) {
    const cityRegex = new RegExp(`\\s*,\\s*${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:,|$)`, 'i')
    street = street.replace(cityRegex, '')
  }
  
  // Remove state if it appears
  if (state) {
    const stateRegex = new RegExp(`\\s*,\\s*${state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:,|$)`, 'i')
    street = street.replace(stateRegex, '')
  }
  
  // Remove zip code (5+ digits)
  street = street.replace(/\s*,\s*\d{5,}(?:,|$)/, '')
  
  // Remove country if it appears
  if (country) {
    const countryRegex = new RegExp(`\\s*,\\s*${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:,|$)`, 'i')
    street = street.replace(countryRegex, '')
  }
  
  // Clean up trailing commas and whitespace
  street = street.replace(/,\s*$/, '').trim()
  
  return street || null
}

/**
 * Clean description text by removing address-related content.
 * Removes city, state, zip_code, country, and full address strings.
 */
export function cleanDescription(
  text: string | null | undefined,
  city?: string | null,
  state?: string | null,
  zip_code?: string | null,
  country?: string | null,
  address?: string | null
): string | null {
  if (!text || typeof text !== 'string') return null
  
  let cleaned = text.trim()
  
  // Remove full address if it appears
  if (address) {
    const addressEscaped = address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    cleaned = cleaned.replace(new RegExp(addressEscaped, 'gi'), '')
  }
  
  // Remove city
  if (city) {
    const cityEscaped = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    cleaned = cleaned.replace(new RegExp(`\\b${cityEscaped}\\b`, 'gi'), '')
  }
  
  // Remove state
  if (state) {
    const stateEscaped = state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    cleaned = cleaned.replace(new RegExp(`\\b${stateEscaped}\\b`, 'gi'), '')
  }
  
  // Remove zip code
  if (zip_code) {
    cleaned = cleaned.replace(new RegExp(`\\b${zip_code}\\b`, 'gi'), '')
  }
  
  // Remove country
  if (country) {
    const countryEscaped = country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    cleaned = cleaned.replace(new RegExp(`\\b${countryEscaped}\\b`, 'gi'), '')
  }
  
  // Clean up multiple spaces and commas
  cleaned = cleaned.replace(/\s*,\s*,/g, ',') // Remove double commas
  cleaned = cleaned.replace(/,\s*$/g, '') // Remove trailing comma
  cleaned = cleaned.replace(/\s+/g, ' ') // Multiple spaces to single
  cleaned = cleaned.replace(/^\s*,\s*/, '') // Remove leading comma
  cleaned = cleaned.trim()
  
  return cleaned || null
}

/**
 * Extract city from address if city field is missing.
 * Looks for city-like patterns in the address string.
 */
function extractCityFromAddress(address: string | null | undefined): string | null {
  if (!address || typeof address !== 'string') return null
  
  // Try to extract city from common address patterns
  // Pattern: "Street, ZIP City" (e.g., "Main St, 12345 Berlin")
  const match = address.match(/,\s*\d{5,}\s+([^,]+?)(?:,|$)/i)
  if (match && match[1]) {
    return match[1].trim()
  }
  
  // Pattern: "Street, City" (if no ZIP, city usually capitalized)
  const match2 = address.match(/,\s*([A-ZÄÖÜ][^,]+?)(?:,|$)/i)
  if (match2 && match2[1]) {
    return match2[1].trim()
  }
  
  return null
}

/**
 * Build SEO-friendly H1 title for cafe page.
 * Format: {Cafe Name} — {Label} in {City}
 * No street address, no parentheses.
 */
export function buildCafeH1Title(cafe: {
  name: string
  city?: string | null
  address?: string | null
  is_work_friendly?: boolean | null
}): string {
  // Determine city: use city field, or extract from address, or fallback
  let city = cafe.city?.trim() || null
  if (!city && cafe.address) {
    city = extractCityFromAddress(cafe.address)
  }
  city = city || 'Germany'
  
  // Determine work-friendly label
  const workFriendlyLabel = cafe.is_work_friendly === true 
    ? 'Laptop-friendly cafe' 
    : 'Coworking-friendly cafe'
  
  return `${cafe.name} — ${workFriendlyLabel} in ${city}`
}

/**
 * Get Google Maps URL for a cafe.
 * Uses google_maps_url if available, otherwise builds from coordinates or address.
 */
export function getMapsUrl(cafe: {
  google_maps_url?: string | null
  latitude?: number | null
  longitude?: number | null
  name?: string
  address?: string
  city?: string | null
  state?: string | null
  zip_code?: string | null
}): string {
  if (cafe.google_maps_url && cafe.google_maps_url.trim()) {
    return cafe.google_maps_url.trim()
  }
  
  if (cafe.latitude != null && cafe.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${cafe.latitude},${cafe.longitude}`
  }
  
  // Fallback to address search
  const q = [cafe.name, cafe.address, cafe.city, cafe.state, cafe.zip_code]
    .filter(Boolean)
    .join(', ')
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}`
}
