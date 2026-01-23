'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Cafe } from '@/src/lib/supabase/types'
import { formatWorkScore } from '@/lib/utils/cafe-formatters'
import CafeMap from './CafeMap'
import LaptopFriendlyIndicators from './LaptopFriendlyIndicators'
import { getLocaleFromPathname } from '@/lib/i18n/routing'
import { withLocale } from '@/lib/i18n/path'

interface CafeDetailProps {
  cafe: Cafe
}

export default function CafeDetail({ cafe }: CafeDetailProps) {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const homeHref = withLocale(locale, '/')

  const getRatingStars = (rating: number | null) => {
    if (!rating) return null
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center space-x-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-2xl">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400 text-2xl">☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-300 text-2xl">★</span>
        ))}
        <span className="ml-3 text-xl font-semibold text-gray-900">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const getNoiseLevelBadge = (level: string | null) => {
    if (!level) return null
    const colors = {
      quiet: 'bg-green-100 text-green-800 border-green-300',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      loud: 'bg-red-100 text-red-800 border-red-300',
      variable: 'bg-blue-100 text-blue-800 border-blue-300',
    }
    return (
      <span className={`px-4 py-2 text-sm font-medium rounded-lg border-2 ${colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {level.toUpperCase()}
      </span>
    )
  }

  const formatHours = (hours: any) => {
    if (!hours || typeof hours !== 'object') return null
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    return days.map((day, index) => {
      if (hours[day]) {
        return { day: dayLabels[index], hours: hours[day] }
      }
      return null
    }).filter(Boolean)
  }

  const formattedHours = formatHours(cafe.hours)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href={homeHref}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium mb-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Café Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {cafe.name}
                </h1>
                {cafe.is_verified && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full flex items-center gap-1">
                    <span>✓</span>
                    Verified
                  </span>
                )}
              </div>
              
              <p className="text-lg text-gray-600 mb-4">
                {cafe.address}, {cafe.city}{cafe.state ? `, ${cafe.state}` : ''} {cafe.zip_code}
              </p>

              {/* Work Score */}
              {(() => {
                const score = cafe.work_score ?? cafe.ai_score
                const formattedScore = score != null ? formatWorkScore(score) : null
                return formattedScore ? (
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary-600">{formattedScore}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {cafe.google_ratings_total ? `${cafe.google_ratings_total.toLocaleString()} ${cafe.google_ratings_total === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}
                    </p>
                  </div>
                ) : null
              })()}

              {/* Noise Level Badge */}
              {cafe.ai_noise_level && (
                <div className="mb-4">
                  {getNoiseLevelBadge(cafe.ai_noise_level)}
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-2">
              {cafe.phone && (
                <a
                  href={`tel:${cafe.phone}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {cafe.phone}
                </a>
              )}
              {cafe.website && (
                <a
                  href={cafe.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {cafe.description && (
            <p className="text-gray-700 mt-6 leading-relaxed">
              {cafe.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            {cafe.latitude && cafe.longitude && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Location</h2>
                </div>
                <CafeMap
                  latitude={cafe.latitude}
                  longitude={cafe.longitude}
                  name={cafe.name}
                  address={cafe.address}
                />
              </div>
            )}

            {/* Laptop-Friendly Indicators */}
            <LaptopFriendlyIndicators cafe={cafe} />

            {/* Business Hours */}
            {formattedHours && formattedHours.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Hours</h2>
                <dl className="space-y-2">
                  {formattedHours.map((item: any) => (
                    <div key={item.day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <dt className="text-sm font-medium text-gray-700">{item.day}</dt>
                      <dd className="text-sm text-gray-600">{item.hours}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Policies */}
            {cafe.ai_laptop_policy && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Policies</h2>
                <dl className="space-y-3">
                  {cafe.ai_laptop_policy && (
                    <div>
                      <dt className="text-sm font-medium text-gray-700">Laptop Policy</dt>
                      <dd className="text-sm text-gray-600 mt-1">{cafe.ai_laptop_policy}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Info</h2>
              <dl className="space-y-3">
                {cafe.ai_wifi_quality && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span>📶</span> WiFi
                    </dt>
                    <dd className="text-sm text-gray-600 mt-1 ml-6">{cafe.ai_wifi_quality}</dd>
                  </div>
                )}
                {cafe.ai_power_outlets && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span>🔌</span> Power Outlets
                    </dt>
                    <dd className="text-sm text-gray-600 mt-1 ml-6">{cafe.ai_power_outlets}</dd>
                  </div>
                )}
                {cafe.ai_noise_level && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span>🔊</span> Noise Level
                    </dt>
                    <dd className="text-sm text-gray-600 mt-1 ml-6">{cafe.ai_noise_level}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="space-y-2">
                {cafe.ai_laptop_policy && (
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="mr-2">💼</span>
                    {cafe.ai_laptop_policy}
                  </div>
                )}
                {!cafe.ai_laptop_policy && (
                  <p className="text-sm text-gray-500">No additional information listed</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
