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
    const levelLower = level.toLowerCase()
    const colors = {
      quiet: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      loud: 'bg-red-100 text-red-800',
      variable: 'bg-blue-100 text-blue-800',
    }
    const colorKey = Object.keys(colors).find(key => levelLower.includes(key)) as keyof typeof colors
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorKey ? colors[colorKey] : 'bg-gray-100 text-gray-800'}`}>
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

        {/* Rating */}
        {(cafe.google_rating || cafe.work_score) && (
          <div className="mb-4">
            {cafe.google_rating && getRatingStars(cafe.google_rating)}
            {cafe.work_score != null && (
              <div className="mt-2">
                <span className="text-sm font-medium text-primary-600">Work Score: {cafe.work_score}/10</span>
              </div>
            )}
            {cafe.google_ratings_total && cafe.google_ratings_total > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {cafe.google_ratings_total} {cafe.google_ratings_total === 1 ? 'review' : 'reviews'}
              </p>
            )}
          </div>
        )}

        {/* Laptop-Friendly Features */}
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            {cafe.is_work_friendly && (
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700">Work-friendly</span>
              </div>
            )}
            {cafe.ai_wifi_quality && (
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-green-600">📶</span>
                <span className="text-gray-700">{cafe.ai_wifi_quality}</span>
              </div>
            )}
            {cafe.ai_power_outlets && (
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-blue-600">🔌</span>
                <span className="text-gray-700">{cafe.ai_power_outlets}</span>
              </div>
            )}
            {cafe.ai_noise_level && (
              <div className="flex items-center space-x-1">
                {getNoiseLevelBadge(cafe.ai_noise_level)}
              </div>
            )}
            {cafe.ai_laptop_policy && (
              <div className="flex items-center space-x-1 text-sm text-gray-700">
                <span>💼</span>
                <span>{cafe.ai_laptop_policy}</span>
              </div>
            )}
          </div>
        </div>

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
