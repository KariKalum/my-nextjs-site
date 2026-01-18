'use client'

import type { Cafe } from '@/lib/supabase'

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
        <div className="pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📶</span>
              <h3 className="text-lg font-semibold text-gray-900">WiFi</h3>
            </div>
            {getStatusIcon(cafe.wifi_available)}
          </div>
          {cafe.wifi_available && (
            <div className="ml-11 space-y-2">
              {cafe.wifi_speed_rating && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Speed Rating</span>
                  </div>
                  {getRatingBar(cafe.wifi_speed_rating)}
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {cafe.wifi_password_required && (
                  <span>
                    {cafe.wifi_password ? (
                      <span>Password: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{cafe.wifi_password}</code></span>
                    ) : (
                      <span>Password required (ask staff)</span>
                    )}
                  </span>
                )}
                {!cafe.wifi_password_required && (
                  <span className="text-green-600">Free WiFi - No password needed</span>
                )}
              </div>
            </div>
          )}
          {!cafe.wifi_available && (
            <p className="ml-11 text-sm text-gray-500">WiFi not available</p>
          )}
        </div>

        {/* Power Outlets */}
        <div className="pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔌</span>
              <h3 className="text-lg font-semibold text-gray-900">Power Outlets</h3>
            </div>
            {getStatusIcon(cafe.power_outlets_available)}
          </div>
          {cafe.power_outlets_available && cafe.power_outlet_rating && (
            <div className="ml-11">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Availability Rating</span>
              </div>
              {getRatingBar(cafe.power_outlet_rating)}
            </div>
          )}
          {!cafe.power_outlets_available && (
            <p className="ml-11 text-sm text-gray-500">Power outlets not available</p>
          )}
        </div>

        {/* Seating & Space */}
        <div className="pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪑</span>
              <h3 className="text-lg font-semibold text-gray-900">Seating & Space</h3>
            </div>
            {getStatusIcon(cafe.comfortable_seating)}
          </div>
          <div className="ml-11 space-y-3">
            {cafe.table_space_rating && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Table Space Rating</span>
                </div>
                {getRatingBar(cafe.table_space_rating)}
              </div>
            )}
            {cafe.seating_capacity > 0 && (
              <p className="text-sm text-gray-600">
                Capacity: {cafe.seating_capacity} seats
              </p>
            )}
            {cafe.seating_variety && (
              <p className="text-sm text-gray-600 capitalize">
                Types: {cafe.seating_variety}
              </p>
            )}
          </div>
        </div>

        {/* Lighting */}
        <div className="pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <h3 className="text-lg font-semibold text-gray-900">Lighting</h3>
            </div>
            {getStatusIcon(cafe.natural_light || (cafe.lighting_rating ? cafe.lighting_rating >= 3 : false))}
          </div>
          <div className="ml-11 space-y-2">
            {cafe.lighting_rating && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Lighting Quality</span>
                </div>
                {getRatingBar(cafe.lighting_rating)}
              </div>
            )}
            {cafe.natural_light && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <span>☀️</span> Natural light available
              </p>
            )}
          </div>
        </div>

        {/* Environment */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🌿</span>
            <h3 className="text-lg font-semibold text-gray-900">Environment</h3>
          </div>
          <div className="ml-11 space-y-2">
            {cafe.noise_level && (
              <div>
                <span className="text-sm font-medium text-gray-700">Noise Level: </span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  cafe.noise_level === 'quiet' ? 'bg-green-100 text-green-800' :
                  cafe.noise_level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  cafe.noise_level === 'loud' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {cafe.noise_level.toUpperCase()}
                </span>
              </div>
            )}
            {cafe.conversation_friendly !== undefined && (
              <p className="text-sm text-gray-600">
                Conversation {cafe.conversation_friendly ? 'friendly' : 'discouraged'}
              </p>
            )}
            {cafe.music_type && (
              <p className="text-sm text-gray-600 capitalize">
                Music: {cafe.music_type}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
