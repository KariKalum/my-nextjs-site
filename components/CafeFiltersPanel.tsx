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

  // Get unique cities from cafes
  const cities = Array.from(new Set(cafes.map(cafe => cafe.city))).sort()

  const updateFilter = (key: keyof CafeFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const toggleNoiseLevel = (level: string) => {
    const currentLevels = filters.noise_level || []
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter(l => l !== level)
      : [...currentLevels, level]
    updateFilter('noise_level', newLevels.length > 0 ? newLevels : undefined)
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
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* WiFi Filter */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.wifi_available || false}
                onChange={(e) => updateFilter('wifi_available', e.target.checked || undefined)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                WiFi Available
              </span>
            </label>
            {filters.wifi_available && (
              <div className="mt-2 ml-6">
                <label className="block text-xs text-gray-600 mb-1">
                  Min WiFi Rating: {filters.min_wifi_rating || 1}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={filters.min_wifi_rating || 1}
                  onChange={(e) => updateFilter('min_wifi_rating', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>5</span>
                </div>
              </div>
            )}
          </div>

          {/* Power Outlets Filter */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.power_outlets_available || false}
                onChange={(e) => updateFilter('power_outlets_available', e.target.checked || undefined)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Power Outlets
              </span>
            </label>
            {filters.power_outlets_available && (
              <div className="mt-2 ml-6">
                <label className="block text-xs text-gray-600 mb-1">
                  Min Outlet Rating: {filters.min_outlet_rating || 1}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={filters.min_outlet_rating || 1}
                  onChange={(e) => updateFilter('min_outlet_rating', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>5</span>
                </div>
              </div>
            )}
          </div>

          {/* Noise Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Noise Level
            </label>
            <div className="space-y-2">
              {['quiet', 'moderate', 'loud', 'variable'].map(level => (
                <label key={level} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.noise_level?.includes(level) || false}
                    onChange={() => toggleNoiseLevel(level)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Overall Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Overall Rating: {filters.min_overall_rating || 1.0}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={filters.min_overall_rating || 1}
              onChange={(e) => updateFilter('min_overall_rating', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1.0</span>
              <span>5.0</span>
            </div>
          </div>

          {/* Time Limit Filter */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.no_time_limit || false}
                onChange={(e) => updateFilter('no_time_limit', e.target.checked || undefined)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                No Time Limit
              </span>
            </label>
          </div>

          {/* Quiet Only Filter */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.quiet_only || false}
                onChange={(e) => updateFilter('quiet_only', e.target.checked || undefined)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Quiet Only
              </span>
            </label>
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
