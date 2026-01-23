'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import type { Cafe, CafeFilters } from '@/src/lib/supabase/types'
import CafeCard from './CafeCard'

export default function CafeListing() {
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [filteredCafes, setFilteredCafes] = useState<Cafe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      
      // Create Supabase client (validated at module load)
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('cafes')
        .select('*')
        .or('is_active.is.null,is_active.eq.true')
        .order('work_score', { ascending: false, nullsFirst: false })

      // If error, handle it gracefully
      if (fetchError) {
        console.error('Supabase query error:', fetchError)
        setCafes([])
        setError('Failed to load cafés. Please check your Supabase connection.')
        return
      }

      // Successfully connected to Supabase
      // Show data from database (even if empty - this means no cafes added yet)
      setCafes(data || [])
      setError(null)
      
    } catch (err: any) {
      console.error('Error fetching cafes:', err)
      setCafes([])
      setError('Failed to load cafés. Check your Supabase connection.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...cafes]

    // Filter by city
    if (filters.city) {
      const normalizedCityFilter = filters.city.toLowerCase()
      filtered = filtered.filter(cafe => 
        (cafe.city ?? '').toLowerCase().includes(normalizedCityFilter)
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

