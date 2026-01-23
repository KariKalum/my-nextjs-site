'use client'

import { useState } from 'react'
import type { CafeFilters, Cafe } from '@/lib/supabase'

interface CafeFiltersPanelProps {
  filters: CafeFilters
  onFilterChange: (filters: CafeFilters) => void
  onClearFilters: () => void
  cafes: Cafe[]
}

export default function CafeFiltersPanel({
  filters,
  onFilterChange,
  onClearFilters,
  cafes,
}: CafeFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Get unique cities from cafes - filter out null/undefined/empty strings
  const cityOptions = Array.from(
    new Set(
      cafes
        .map(cafe => cafe.city)
        .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    )
  ).sort((a, b) => a.localeCompare(b))

  const updateFilter = (key: keyof CafeFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const toggleNoiseLevel = (level: string) => {
    const currentLevels = filters.ai_noise_level || []
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter(l => l !== level)
      : [...currentLevels, level]
    updateFilter('ai_noise_level', newLevels.length > 0 ? newLevels : undefined)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-left font-semibold text-gray-900"
        >
          <span>Filters</span>
          <svg
            className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filters content */}
      <div className={isOpen ? 'block' : 'hidden lg:block'}>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              value={filters.city || ''}
              onChange={(e) => updateFilter('city', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Cities</option>
              {cityOptions.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Work Friendly Filter */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.is_work_friendly === true}
                onChange={(e) => updateFilter('is_work_friendly', e.target.checked ? true : undefined)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Work Friendly
              </span>
            </label>
          </div>

          {/* Work Score Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Work Score: {filters.min_work_score || 0}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.min_work_score || 0}
              onChange={(e) => updateFilter('min_work_score', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          {/* Google Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Google Rating: {filters.min_google_rating || 1.0}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={filters.min_google_rating || 1}
              onChange={(e) => updateFilter('min_google_rating', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1.0</span>
              <span>5.0</span>
            </div>
          </div>

          {/* Noise Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Noise Level
            </label>
            <div className="space-y-2">
              {['quiet', 'moderate', 'loud'].map(level => (
                <label key={level} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.ai_noise_level?.some(l => level.toLowerCase().includes(l.toLowerCase()) || l.toLowerCase().includes(level.toLowerCase())) || false}
                    onChange={() => toggleNoiseLevel(level)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters Button */}
          {Object.keys(filters).length > 0 && (
            <button
              onClick={onClearFilters}
              className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
