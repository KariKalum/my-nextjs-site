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

// Types for our database
export interface Cafe {
  id: string
  place_id?: string | null
  name: string
  description: string | null
  address: string
  city: string
  state: string | null
  zip_code: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  latitude: number | null
  longitude: number | null
  google_maps_url?: string | null
  wifi_available: boolean
  wifi_speed_rating: number | null
  wifi_password_required: boolean
  wifi_password: string | null
  power_outlets_available: boolean
  power_outlet_rating: number | null
  seating_capacity: number
  comfortable_seating: boolean
  seating_variety: string | null
  noise_level: 'quiet' | 'moderate' | 'loud' | 'variable' | null
  music_type: string | null
  conversation_friendly: boolean
  table_space_rating: number | null
  natural_light: boolean
  lighting_rating: number | null
  hours: any
  time_limit_minutes: number | null
  reservation_required: boolean
  laptop_policy: string | null
  parking_available: boolean
  parking_type: string | null
  accessible: boolean
  pet_friendly: boolean
  outdoor_seating: boolean
  work_score?: number | null
  work_signals?: any | null
  is_work_friendly?: boolean | null
  overall_laptop_rating: number | null
  total_reviews: number
  total_visits: number
  google_rating?: number | null
  google_ratings_total?: number | null
  price_level?: number | null
  business_status?: string | null
  google_reviews?: any[] | null
  google_reviews_fetched_at?: string | null
  coffee_quality?: 'unknown' | 'low' | 'medium' | 'high' | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface CafeFilters {
  city?: string
  wifi_available?: boolean
  power_outlets_available?: boolean
  noise_level?: string[]
  min_wifi_rating?: number
  min_outlet_rating?: number
  min_overall_rating?: number
  no_time_limit?: boolean
  quiet_only?: boolean
}
