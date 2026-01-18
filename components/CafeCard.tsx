'use client'

import type { Cafe } from '@/lib/supabase'

interface CafeCardProps {
  cafe: Cafe
}

export default function CafeCard({ cafe }: CafeCardProps) {
  const getRatingStars = (rating: number | null) => {
    if (!rating) return null
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center space-x-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-300">★</span>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const getNoiseLevelBadge = (level: string | null) => {
    if (!level) return null
    const colors = {
      quiet: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      loud: 'bg-red-100 text-red-800',
      variable: 'bg-blue-100 text-blue-800',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {level}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {cafe.name}
            </h3>
            <p className="text-sm text-gray-600">
              {cafe.address}, {cafe.city}{cafe.state ? `, ${cafe.state}` : ''}
            </p>
          </div>
          {cafe.is_verified && (
            <span className="ml-2 text-primary-600" title="Verified">
              ✓
            </span>
          )}
        </div>

        {/* Description */}
        {cafe.description && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
            {cafe.description}
          </p>
        )}

        {/* Overall Rating */}
        {cafe.overall_laptop_rating && (
          <div className="mb-4">
            {getRatingStars(cafe.overall_laptop_rating)}
            {cafe.total_reviews > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {cafe.total_reviews} {cafe.total_reviews === 1 ? 'review' : 'reviews'}
              </p>
            )}
          </div>
        )}

        {/* Laptop-Friendly Features */}
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            {cafe.wifi_available && (
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-green-600">📶</span>
                <span className="text-gray-700">WiFi</span>
                {cafe.wifi_speed_rating && (
                  <span className="text-gray-500">({cafe.wifi_speed_rating}/5)</span>
                )}
              </div>
            )}
            {cafe.power_outlets_available && (
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-blue-600">🔌</span>
                <span className="text-gray-700">Outlets</span>
                {cafe.power_outlet_rating && (
                  <span className="text-gray-500">({cafe.power_outlet_rating}/5)</span>
                )}
              </div>
            )}
            {cafe.noise_level && (
              <div className="flex items-center space-x-1">
                {getNoiseLevelBadge(cafe.noise_level)}
              </div>
            )}
            {cafe.natural_light && (
              <div className="flex items-center space-x-1 text-sm text-gray-700">
                <span>☀️</span>
                <span>Natural Light</span>
              </div>
            )}
            {!cafe.time_limit_minutes && (
              <div className="flex items-center space-x-1 text-sm text-gray-700">
                <span>⏰</span>
                <span>No Time Limit</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-4">
          {cafe.seating_capacity > 0 && (
            <span>🪑 {cafe.seating_capacity} seats</span>
          )}
          {cafe.parking_available && (
            <span>🅿️ Parking</span>
          )}
          {cafe.outdoor_seating && (
            <span>🌳 Outdoor</span>
          )}
          {cafe.pet_friendly && (
            <span>🐾 Pet Friendly</span>
          )}
          {cafe.accessible && (
            <span>♿ Accessible</span>
          )}
        </div>

        {/* Time Limit Warning */}
        {cafe.time_limit_minutes && cafe.time_limit_minutes > 0 && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ Time limit: {cafe.time_limit_minutes} minutes
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-4 text-sm">
            {cafe.website && (
              <a
                href={cafe.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Website
              </a>
            )}
            {cafe.phone && (
              <a
                href={`tel:${cafe.phone}`}
                className="text-gray-600 hover:text-gray-900"
              >
                {cafe.phone}
              </a>
            )}
          </div>
          <a
            href={`/cafe/${cafe.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View Details →
          </a>
        </div>
      </div>
    </div>
  )
}
