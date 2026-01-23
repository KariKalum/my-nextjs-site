'use client'

import type { Cafe } from '@/src/lib/supabase/types'
import { formatWorkScore } from '@/lib/utils/cafe-formatters'

interface LaptopFriendlyIndicatorsProps {
  cafe: Cafe
}

export default function LaptopFriendlyIndicators({ cafe }: LaptopFriendlyIndicatorsProps) {
  const getRatingBar = (rating: number | null, maxRating: number = 5) => {
    if (!rating) return null
    
    const percentage = (rating / maxRating) * 100
    const getColor = (rating: number) => {
      if (rating >= 4) return 'bg-green-500'
      if (rating >= 3) return 'bg-yellow-500'
      return 'bg-red-500'
    }

    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${getColor(rating)} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-900 w-12 text-right">
          {rating.toFixed(1)}/{maxRating}
        </span>
      </div>
    )
  }

  const getStatusIcon = (available: boolean) => {
    return available ? (
      <span className="text-green-600 text-xl">✓</span>
    ) : (
      <span className="text-red-600 text-xl">✗</span>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        💻 Laptop-Friendly Features
      </h2>

      <div className="space-y-6">
        {/* WiFi */}
        {cafe.ai_wifi_quality && (
          <div className="pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📶</span>
              <h3 className="text-lg font-semibold text-gray-900">WiFi</h3>
            </div>
            <div className="ml-11">
              <p className="text-sm text-gray-600">{cafe.ai_wifi_quality}</p>
            </div>
          </div>
        )}

        {/* Power Outlets */}
        {cafe.ai_power_outlets && (
          <div className="pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔌</span>
              <h3 className="text-lg font-semibold text-gray-900">Power Outlets</h3>
            </div>
            <div className="ml-11">
              <p className="text-sm text-gray-600">{cafe.ai_power_outlets}</p>
            </div>
          </div>
        )}

        {/* Work Score */}
        {(cafe.work_score != null || cafe.ai_score != null) && (
          <div className="pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💻</span>
              <h3 className="text-lg font-semibold text-gray-900">Work Score</h3>
            </div>
            <div className="ml-11">
              <p className="text-sm text-gray-600">
                {formatWorkScore(cafe.work_score ?? cafe.ai_score) ?? '—'}
              </p>
            </div>
          </div>
        )}

        {/* Environment */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🌿</span>
            <h3 className="text-lg font-semibold text-gray-900">Environment</h3>
          </div>
          <div className="ml-11 space-y-2">
            {cafe.ai_noise_level && (
              <div>
                <span className="text-sm font-medium text-gray-700">Noise Level: </span>
                <span className="text-sm font-medium px-2 py-1 rounded bg-gray-100 text-gray-800">
                  {cafe.ai_noise_level}
                </span>
              </div>
            )}
            {cafe.ai_laptop_policy && (
              <p className="text-sm text-gray-600">
                Laptop Policy: {cafe.ai_laptop_policy}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
