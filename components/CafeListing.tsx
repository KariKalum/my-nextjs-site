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
        .order('work_score', { ascending: false, nullsFirst: false })

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

    // Filter by work-friendly
    if (filters.is_work_friendly !== undefined) {
      filtered = filtered.filter(cafe => cafe.is_work_friendly === filters.is_work_friendly)
    }

    // Filter by work score
    if (filters.min_work_score) {
      filtered = filtered.filter(cafe => 
        cafe.work_score && cafe.work_score >= filters.min_work_score!
      )
    }

    // Filter by Google rating
    if (filters.min_google_rating) {
      filtered = filtered.filter(cafe => 
        cafe.google_rating && cafe.google_rating >= filters.min_google_rating!
      )
    }

    // Filter by noise level (using ai_noise_level)
    if (filters.ai_noise_level && filters.ai_noise_level.length > 0) {
      filtered = filtered.filter(cafe => 
        cafe.ai_noise_level && filters.ai_noise_level!.some(level => 
          cafe.ai_noise_level?.toLowerCase().includes(level.toLowerCase())
        )
      )
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
// Mock data fallback - matches new schema
function getMockCafes(): Cafe[] {
  return [
    {
      id: '1',
      place_id: 'ChIJMock1',
      name: 'The Cozy Corner',
      description: 'A quiet café perfect for focused work with excellent WiFi and plenty of outlets.',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      country: 'US',
      phone: '+1-555-0101',
      website: null,
      latitude: 37.7749,
      longitude: -122.4194,
      google_rating: 4.8,
      google_ratings_total: 127,
      price_level: 2,
      business_status: 'OPERATIONAL',
      hours: { monday: '7am-8pm', tuesday: '7am-8pm' },
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
  ]
}
