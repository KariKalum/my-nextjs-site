'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Cafe } from '@/lib/supabase'
import BetaNotice from './BetaNotice'
import CafeMap from './CafeMap'
import CafeStructuredData from './CafeStructuredData'
import CafeFAQ from './CafeFAQ'
import { getAbsoluteUrl } from '@/lib/seo/metadata'
import { extractStreetFromAddress } from '@/lib/seo/cafe-seo'

interface CafeDetailSEOProps {
  cafe: Cafe
  nearbyCafes?: Cafe[]
}

export default function CafeDetailSEO({ cafe, nearbyCafes = [] }: CafeDetailSEOProps) {
  const [showPassword, setShowPassword] = useState(false)

  // Build canonical URL
  const canonicalId = cafe.place_id || cafe.id
  const cafeUrl = getAbsoluteUrl(`/cafe/${canonicalId}`)

  // Determine if work-friendly
  const isWorkFriendly = cafe.is_work_friendly !== false && 
    (cafe.is_work_friendly === true || cafe.work_score !== null || cafe.overall_laptop_rating !== null)

  // Build H1
  const city = cafe.city || 'Germany'
  const street = extractStreetFromAddress(cafe.address)
  const streetPart = street ? ` (${street})` : ''
  const h1Text = isWorkFriendly 
    ? `${cafe.name} — Laptop-friendly cafe in ${city}${streetPart}`
    : `${cafe.name} — Cafe in ${city}${streetPart}`

  // Format hours
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

  // Format last updated
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch {
      return null
    }
  }

  const lastUpdated = cafe.updated_at ? formatDate(cafe.updated_at) : null

  return (
    <>
      {/* JSON-LD Structured Data */}
      <CafeStructuredData cafe={cafe} cafeUrl={cafeUrl} />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb Navigation */}
        <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link href="/" className="hover:text-primary-600">
                  Home
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link href={`/cities/${encodeURIComponent(cafe.city?.toLowerCase() || '')}`} className="hover:text-primary-600">
                  {cafe.city || 'Cities'}
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-gray-900 font-medium" aria-current="page">
                {cafe.name}
              </li>
            </ol>
          </div>
        </nav>

        {/* Beta Notice */}
        <BetaNotice />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {h1Text}
                </h1>
                
                {/* Address as semantic HTML */}
                <address className="not-italic text-lg text-gray-700 mb-4">
                  {cafe.address}
                  {cafe.city && `, ${cafe.city}`}
                  {cafe.state && `, ${cafe.state}`}
                  {cafe.zip_code && ` ${cafe.zip_code}`}
                  {cafe.country && `, ${cafe.country}`}
                </address>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {cafe.phone && (
                    <a href={`tel:${cafe.phone}`} className="hover:text-primary-600">
                      📞 {cafe.phone}
                    </a>
                  )}
                  {cafe.email && (
                    <a href={`mailto:${cafe.email}`} className="hover:text-primary-600">
                      ✉️ {cafe.email}
                    </a>
                  )}
                  {cafe.website && (
                    <a 
                      href={cafe.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-primary-600"
                    >
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>

              {/* Verification Badge */}
              {cafe.is_verified && (
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full inline-flex items-center gap-1 h-fit">
                  <span>✓</span>
                  Verified
                </span>
              )}
            </div>

            {/* Description */}
            {cafe.description && (
              <p className="text-gray-700 leading-relaxed text-base md:text-lg mb-4">
                {cafe.description}
              </p>
            )}

            {/* Ratings */}
            {(cafe.overall_laptop_rating || cafe.google_rating) && (
              <div className="flex flex-wrap gap-6 mt-4">
                {cafe.overall_laptop_rating && (
                  <div>
                    <span className="text-sm text-gray-600">Laptop Rating: </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {cafe.overall_laptop_rating.toFixed(1)}/5
                    </span>
                    {cafe.total_reviews > 0 && (
                      <span className="text-sm text-gray-600 ml-1">
                        ({cafe.total_reviews} {cafe.total_reviews === 1 ? 'review' : 'reviews'})
                      </span>
                    )}
                  </div>
                )}
                {cafe.google_rating && (
                  <div>
                    <span className="text-sm text-gray-600">Google Rating: </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {cafe.google_rating.toFixed(1)}/5
                    </span>
                    {cafe.google_ratings_total && (
                      <span className="text-sm text-gray-600 ml-1">
                        ({cafe.google_ratings_total.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-4">
                Last updated: {lastUpdated}
              </p>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Work-friendly Overview */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Work-friendly Overview</h2>
                <div className="space-y-4">
                  {(cafe.work_score !== null || cafe.overall_laptop_rating !== null) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Work Score</h3>
                      {cafe.work_score !== null && (
                        <p className="text-gray-700">
                          {cafe.name} has a work score of <strong>{cafe.work_score}/10</strong>, 
                          {' '}indicating {cafe.work_score && cafe.work_score >= 7 ? 'excellent' : cafe.work_score && cafe.work_score >= 5 ? 'good' : 'moderate'} 
                          {' '}suitability for remote work.
                        </p>
                      )}
                      {cafe.overall_laptop_rating && (
                        <p className="text-gray-700 mt-2">
                          Overall laptop rating: <strong>{cafe.overall_laptop_rating.toFixed(1)}/5</strong> based on 
                          {' '}{cafe.total_reviews || 0} {cafe.total_reviews === 1 ? 'review' : 'reviews'}.
                        </p>
                      )}
                    </div>
                  )}

                  {cafe.is_work_friendly !== undefined && (
                    <p className="text-gray-700">
                      This cafe is {cafe.is_work_friendly ? '' : 'not '}officially marked as work-friendly.
                    </p>
                  )}
                </div>
              </section>

              {/* Wi-Fi & Power Outlets */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Wi-Fi & Power Outlets</h2>
                <div className="space-y-4">
                  {/* WiFi */}
                  {cafe.wifi_available ? (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Wi-Fi: Available</h3>
                      {cafe.wifi_speed_rating && (
                        <p className="text-gray-700 mb-2">
                          WiFi speed rating: <strong>{cafe.wifi_speed_rating}/5</strong>
                          {' '}({cafe.wifi_speed_rating >= 4 ? 'Fast' : cafe.wifi_speed_rating >= 3 ? 'Moderate' : 'Basic'})
                        </p>
                      )}
                      {cafe.wifi_password_required && (
                        <div className="mt-2">
                          <p className="text-gray-700 mb-2">Password required to connect.</p>
                          {cafe.wifi_password && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 mb-2"
                              >
                                {showPassword ? 'Hide' : 'Show'} WiFi Password
                              </button>
                              {showPassword && (
                                <p className="text-lg font-mono font-semibold text-gray-900">
                                  {cafe.wifi_password}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700">Wi-Fi: Not available</p>
                  )}

                  {/* Power Outlets */}
                  {cafe.power_outlets_available ? (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Power Outlets: Available</h3>
                      {cafe.power_outlet_rating && (
                        <p className="text-gray-700">
                          Outlet availability rating: <strong>{cafe.power_outlet_rating}/5</strong>
                          {' '}({cafe.power_outlet_rating >= 4 ? 'Plenty' : cafe.power_outlet_rating >= 3 ? 'Adequate' : 'Limited'})
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700">Power Outlets: Not available</p>
                  )}
                </div>
              </section>

              {/* Seating, Space & Comfort */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Seating, Space & Comfort</h2>
                <div className="space-y-3">
                  {cafe.seating_capacity > 0 && (
                    <p className="text-gray-700">
                      <strong>Seating Capacity:</strong> {cafe.seating_capacity} seats
                    </p>
                  )}
                  {cafe.seating_variety && (
                    <p className="text-gray-700">
                      <strong>Seating Types:</strong> {cafe.seating_variety}
                    </p>
                  )}
                  {cafe.comfortable_seating !== undefined && (
                    <p className="text-gray-700">
                      <strong>Comfortable Seating:</strong> {cafe.comfortable_seating ? 'Yes' : 'No'}
                    </p>
                  )}
                  {cafe.table_space_rating && (
                    <p className="text-gray-700">
                      <strong>Table Space Rating:</strong> {cafe.table_space_rating}/5
                      {' '}({cafe.table_space_rating >= 4 ? 'Spacious' : cafe.table_space_rating >= 3 ? 'Adequate' : 'Limited'})
                    </p>
                  )}
                  {cafe.natural_light !== undefined && (
                    <p className="text-gray-700">
                      <strong>Natural Light:</strong> {cafe.natural_light ? 'Yes' : 'No'}
                    </p>
                  )}
                  {cafe.lighting_rating && (
                    <p className="text-gray-700">
                      <strong>Lighting Rating:</strong> {cafe.lighting_rating}/5
                    </p>
                  )}
                </div>
              </section>

              {/* Noise & Vibe */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Noise & Vibe</h2>
                <div className="space-y-3">
                  {cafe.noise_level && (
                    <div>
                      <p className="text-gray-700 mb-2">
                        <strong>Noise Level:</strong> <span className="capitalize">{cafe.noise_level}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        {cafe.noise_level === 'quiet' && 'Perfect for focused work and concentration.'}
                        {cafe.noise_level === 'moderate' && 'Good balance for work and conversation.'}
                        {cafe.noise_level === 'loud' && 'Lively atmosphere, better for collaborative work.'}
                        {cafe.noise_level === 'variable' && 'Noise level varies throughout the day.'}
                      </p>
                    </div>
                  )}
                  {cafe.music_type && (
                    <p className="text-gray-700">
                      <strong>Music Type:</strong> {cafe.music_type}
                    </p>
                  )}
                  {cafe.conversation_friendly !== undefined && (
                    <p className="text-gray-700">
                      <strong>Conversation Friendly:</strong> {cafe.conversation_friendly ? 'Yes' : 'No'}
                    </p>
                  )}
                </div>
              </section>

              {/* Hours, Policies & Time Limits */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hours, Policies & Time Limits</h2>
                <div className="space-y-4">
                  {/* Hours */}
                  {formattedHours && formattedHours.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Operating Hours</h3>
                      <dl className="space-y-2">
                        {formattedHours.map((item: any) => (
                          <div key={item.day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <dt className="text-sm font-medium text-gray-700">{item.day}</dt>
                            <dd className="text-sm text-gray-600">
                              <time>{item.hours}</time>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {/* Policies */}
                  {(cafe.time_limit_minutes || cafe.laptop_policy || cafe.reservation_required) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Laptop Policies</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {cafe.time_limit_minutes && cafe.time_limit_minutes > 0 ? (
                          <li>
                            <strong>Time Limit:</strong> {cafe.time_limit_minutes} minutes
                            {' '}({Math.floor(cafe.time_limit_minutes / 60)}h {cafe.time_limit_minutes % 60}m)
                          </li>
                        ) : (
                          <li><strong>Time Limit:</strong> No time limit</li>
                        )}
                        {cafe.laptop_policy && (
                          <li><strong>Laptop Policy:</strong> {cafe.laptop_policy}</li>
                        )}
                        {cafe.reservation_required && (
                          <li><strong>Reservation:</strong> Required</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </section>

              {/* Location & Directions */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Location & Directions</h2>
                  {cafe.latitude && cafe.longitude && (
                    <CafeMap
                      latitude={cafe.latitude}
                      longitude={cafe.longitude}
                      name={cafe.name}
                      address={cafe.address}
                    />
                  )}
                </div>
              </section>

              {/* FAQ Section */}
              <CafeFAQ cafe={cafe} />

              {/* Internal Links */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Explore More</h2>
                <div className="space-y-3">
                  {cafe.city && (
                    <Link 
                      href={`/cities/${encodeURIComponent(cafe.city.toLowerCase())}`}
                      className="block text-primary-600 hover:text-primary-700 font-medium"
                    >
                      → More laptop-friendly cafes in {cafe.city}
                    </Link>
                  )}
                  {nearbyCafes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Nearby Cafes</h3>
                      <ul className="space-y-2">
                        {nearbyCafes.map((nearby) => (
                          <li key={nearby.id}>
                            <Link 
                              href={`/cafe/${nearby.id}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {nearby.name}
                              {nearby.overall_laptop_rating && (
                                <span className="text-sm text-gray-600 ml-2">
                                  ({nearby.overall_laptop_rating.toFixed(1)}/5)
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Quick Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Info</h2>
                <dl className="space-y-3 text-sm">
                  {cafe.parking_available !== undefined && (
                    <div>
                      <dt className="font-medium text-gray-700">Parking</dt>
                      <dd className="text-gray-600 mt-1">
                        {cafe.parking_available ? `Yes${cafe.parking_type ? ` (${cafe.parking_type})` : ''}` : 'No'}
                      </dd>
                    </div>
                  )}
                  {cafe.outdoor_seating !== undefined && (
                    <div>
                      <dt className="font-medium text-gray-700">Outdoor Seating</dt>
                      <dd className="text-gray-600 mt-1">{cafe.outdoor_seating ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {cafe.accessible !== undefined && (
                    <div>
                      <dt className="font-medium text-gray-700">Wheelchair Accessible</dt>
                      <dd className="text-gray-600 mt-1">{cafe.accessible ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {cafe.pet_friendly !== undefined && (
                    <div>
                      <dt className="font-medium text-gray-700">Pet Friendly</dt>
                      <dd className="text-gray-600 mt-1">{cafe.pet_friendly ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {cafe.price_level && (
                    <div>
                      <dt className="font-medium text-gray-700">Price Level</dt>
                      <dd className="text-gray-600 mt-1">{'$'.repeat(Math.min(cafe.price_level, 4))}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  )
}
