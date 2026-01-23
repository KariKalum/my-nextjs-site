import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use placeholder values if not configured - components will use mock data on error
// These are minimal valid formats that won't cause createClient to throw
const url = supabaseUrl && supabaseUrl.trim() !== '' 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co'

const key = supabaseAnonKey && supabaseAnonKey.trim() !== ''
  ? supabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase not configured. The app will use mock data.')
}

export const supabase = createClient(url, key)

// Types for our database - matches public.cafes table schema exactly
export interface Cafe {
  id: string
  place_id: string | null
  name: string
  description: string | null
  ai_human_summary: string | null
  ai_inference_notes: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  location: string | null
  google_maps_url: string | null
  google_rating: number | null
  google_ratings_total: number | null
  price_level: number | null
  business_status: string | null
  google_reviews: any | null
  google_reviews_fetched_at: string | null
  hours: any | null
  phone: string | null
  website: string | null
  work_score: number | null
  is_work_friendly: boolean | null
  ai_score: number | null
  ai_confidence: string | number | null
  ai_wifi_quality: string | null
  ai_power_outlets: string | null
  ai_noise_level: string | null
  ai_laptop_policy: string | null
  ai_signals: any | null
  ai_evidence: any | null
  ai_reasons: any | null
  ai_structured_json: any | null
  ai_rated_at: string | null
  is_active: boolean | null
  is_verified: boolean | null
  created_at: string | null
  updated_at: string | null
  email: string | null
  /** Combined description field (description + ai_inference_notes) - set by server */
  descriptionText?: string
}

export interface CafeFilters {
  city?: string
  is_work_friendly?: boolean
  min_work_score?: number
  min_google_rating?: number
  ai_noise_level?: string[]
}
