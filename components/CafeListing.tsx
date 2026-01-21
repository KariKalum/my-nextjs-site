'use client'

import { useState, useEffect } from 'react'
import { supabase, type Cafe, type CafeFilters } from '@/lib/supabase'
import CafeCard from './CafeCard'

export default function CafeListing() {
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [filteredCafes, setFilteredCafes] = useState<Cafe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [filters, setFilters] = useState<CafeFilters>({})

  useEffect(() => {
    fetchCafes()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [cafes, filters])

  const fetchCafes = async () => {
    try {
      setLoading(true)
      
      // Check if Supabase is configured by checking environment variable
      // In client components, NEXT_PUBLIC_ variables are available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.trim() === '') {
        console.warn('Supabase not configured. Using mock data.')
        setCafes(getMockCafes())
        setError(null)
        setUsingMockData(true)
        setLoading(false)
        return
      }
      
      const { data, error: fetchError } = await supabase
        .from('cafes')
        .select('*')
        .eq('is_active', true)
        .order('overall_laptop_rating', { ascending: false })

      // If error, check if it's because Supabase isn't configured
      if (fetchError) {
        console.error('Supabase query error:', fetchError)
        // Check if error is due to missing Supabase configuration or invalid credentials
        if (fetchError.code === 'PGRST116' || // Table not found
            fetchError.message?.toLowerCase().includes('invalid') ||
            fetchError.message?.toLowerCase().includes('failed to fetch') ||
            fetchError.message?.toLowerCase().includes('getaddrinfo enotfound')) {
          // Supabase not properly configured or network error, use mock data
          setCafes(getMockCafes())
          setError(null)
          setUsingMockData(true)
          return
        }
        // Real Supabase error (like table doesn't exist), but connection works
        // Show empty state instead of mock data
        setCafes([])
        setError('No cafés found. Add your first café in the admin dashboard.')
        setUsingMockData(false)
        return
      }

      // Successfully connected to Supabase
      // Show data from database (even if empty - this means no cafes added yet)
      setCafes(data || [])
      setError(null)
      setUsingMockData(false)
      
    } catch (err: any) {
      console.error('Error fetching cafes:', err)
      // Check if it's a connection/config error
      if (err?.message?.toLowerCase().includes('fetch') ||
          err?.code === 'ECONNREFUSED' ||
          err?.message?.toLowerCase().includes('enotfound')) {
        // Connection error - check if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
          setCafes(getMockCafes())
          setError(null)
          setUsingMockData(true)
        } else {
          // Supabase is configured but connection failed
          setCafes([])
          setError('Failed to connect to database. Please check your Supabase configuration.')
          setUsingMockData(false)
        }
      } else {
        // Other error - show empty state
        setCafes([])
        setError('Failed to load cafés. Check your database connection.')
        setUsingMockData(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...cafes]

    // Filter by city
    if (filters.city) {
      filtered = filtered.filter(cafe => 
        cafe.city.toLowerCase().includes(filters.city!.toLowerCase())
      )
    }

    // Filter by WiFi availability
    if (filters.wifi_available) {
      filtered = filtered.filter(cafe => cafe.wifi_available)
    }

    // Filter by power outlets
    if (filters.power_outlets_available) {
      filtered = filtered.filter(cafe => cafe.power_outlets_available)
    }

    // Filter by noise level
    if (filters.noise_level && filters.noise_level.length > 0) {
      filtered = filtered.filter(cafe => 
        cafe.noise_level && filters.noise_level!.includes(cafe.noise_level)
      )
    }

    // Filter by WiFi rating
    if (filters.min_wifi_rating) {
      filtered = filtered.filter(cafe => 
        cafe.wifi_speed_rating && cafe.wifi_speed_rating >= filters.min_wifi_rating!
      )
    }

    // Filter by outlet rating
    if (filters.min_outlet_rating) {
      filtered = filtered.filter(cafe => 
        cafe.power_outlet_rating && cafe.power_outlet_rating >= filters.min_outlet_rating!
      )
    }

    // Filter by overall rating
    if (filters.min_overall_rating) {
      filtered = filtered.filter(cafe => 
        cafe.overall_laptop_rating && cafe.overall_laptop_rating >= filters.min_overall_rating!
      )
    }

    // Filter by time limit
    if (filters.no_time_limit) {
      filtered = filtered.filter(cafe => 
        !cafe.time_limit_minutes || cafe.time_limit_minutes === 0
      )
    }

    // Filter for quiet only
    if (filters.quiet_only) {
      filtered = filtered.filter(cafe => cafe.noise_level === 'quiet')
    }

    setFilteredCafes(filtered)
  }

  const handleFilterChange = (newFilters: CafeFilters) => {
    setFilters(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cafés...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <main className="flex-1 w-full">
          {/* Results Header */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {filteredCafes.length} {filteredCafes.length === 1 ? 'Café' : 'Cafés'} Found
              </h2>
              {Object.keys(filters).length > 0 && (
                <p className="text-sm text-gray-500 mt-1">Filters applied</p>
              )}
            </div>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Mock Data Info */}
          {usingMockData && !error && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">ℹ️ Demo Mode:</span> You're viewing sample data. 
                <span className="ml-2 text-blue-600">
                  <a 
                    href="/admin" 
                    className="underline hover:text-blue-800"
                  >
                    Add your own cafés
                  </a>
                </span>
              </p>
            </div>
          )}

          {/* Café Grid */}
          {filteredCafes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No cafés found matching your filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear filters to see all cafés
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Mock data for development/demo purposes
function getMockCafes(): Cafe[] {
  return [
    {
      id: '1',
      name: 'The Cozy Corner',
      description: 'A quiet café perfect for focused work with excellent WiFi and plenty of outlets.',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      country: 'US',
      phone: '+1-555-0101',
      email: null,
      website: null,
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
      hours: { monday: '7am-8pm', tuesday: '7am-8pm' },
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
    {
      id: '2',
      name: 'Brew & Code',
      description: 'Tech-focused café with high-speed WiFi, multiple outlets, and great coffee.',
      address: '456 Tech Avenue',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94103',
      country: 'US',
      phone: '+1-555-0102',
      email: null,
      website: null,
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
      hours: { monday: '6am-10pm' },
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
    {
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
      hours: { monday: '8am-6pm' },
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
    {
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
      hours: { monday: '7am-9pm' },
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
  ]
}
