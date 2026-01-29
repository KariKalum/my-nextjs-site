/**
 * Allowed cafe column names for edit suggestions (user form + admin apply).
 * Only these keys are applied to public.cafes when approving a suggestion.
 */
export const ALLOWED_CAFE_FIELDS = [
  'name', 'description', 'address', 'city', 'state', 'zip_code', 'country',
  'phone', 'email', 'website', 'latitude', 'longitude', 'hours',
  'google_maps_url', 'google_rating', 'google_ratings_total', 'price_level',
  'business_status', 'google_reviews', 'google_reviews_fetched_at',
  'work_score', 'is_work_friendly', 'ai_score', 'ai_confidence',
  'ai_wifi_quality', 'ai_power_outlets', 'ai_noise_level', 'ai_laptop_policy',
  'ai_signals', 'ai_evidence', 'ai_reasons', 'ai_structured_json',
  'ai_human_summary', 'ai_inference_notes', 'ai_rated_at',
  'is_active', 'is_verified', 'updated_at',
  'wifi_available', 'wifi_speed_rating', 'power_outlets_available',
  'seating_capacity', 'noise_level', 'table_space_rating', 'total_reviews', 'total_visits',
] as const

export const ALLOWED_CAFE_FIELDS_SET = new Set<string>(ALLOWED_CAFE_FIELDS)

/** Keys in changes that are never applied to cafes (evidence/comment only). */
export const NON_APPLYABLE_KEYS = new Set(['evidence', 'comment', 'note'])

export function isAllowedCafeField(key: string): boolean {
  return ALLOWED_CAFE_FIELDS_SET.has(key)
}
