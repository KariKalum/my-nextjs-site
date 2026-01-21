'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Submission {
  id: string
  name: string
  city: string
  address: string
  website: string | null
  google_maps_url: string | null
  submitter_email: string | null
  notes: string | null
  wifi_notes: string | null
  power_notes: string | null
  noise_notes: string | null
  time_limit_notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  review_notes: string | null
  cafe_id: string | null
  created_at: string
  updated_at: string
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    fetchSubmissions()
  }, [filter])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setSubmissions((data as Submission[]) || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching submissions:', err)
      setError('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (submission: Submission) => {
    if (!confirm(`Approve "${submission.name}" and create a café entry?`)) {
      return
    }

    try {
      // Build cafe data with intelligent field mapping
      const cafeData: any = {
        name: submission.name,
        city: submission.city,
        address: submission.address,
        country: 'DE', // Default to Germany
        is_active: true,
        is_verified: false, // Can be verified later
      }

      // Add website if available (validate it's not localhost)
      if (submission.website) {
        try {
          const url = new URL(submission.website)
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('127.')) {
            // Skip localhost URLs - don't add website field
            console.warn(`Skipping localhost website URL for cafe: ${submission.name}`)
          } else {
            cafeData.website = submission.website
          }
        } catch {
          // Invalid URL format - skip it
          console.warn(`Skipping invalid website URL for cafe: ${submission.name}`)
        }
      }

      // Add description from notes
      if (submission.notes) {
        cafeData.description = submission.notes
      }

      // Infer laptop-friendly fields from notes
      // WiFi
      if (submission.wifi_notes) {
        cafeData.wifi_available = true
        // Try to infer rating from notes (e.g., "fast", "excellent", "5/5")
        const wifiLower = submission.wifi_notes.toLowerCase()
        if (wifiLower.includes('excellent') || wifiLower.includes('5') || wifiLower.includes('fast')) {
          cafeData.wifi_speed_rating = 5
        } else if (wifiLower.includes('good') || wifiLower.includes('4')) {
          cafeData.wifi_speed_rating = 4
        } else if (wifiLower.includes('ok') || wifiLower.includes('3')) {
          cafeData.wifi_speed_rating = 3
        } else {
          cafeData.wifi_speed_rating = 4 // Default to 4 if wifi_notes present
        }
        // Check for password requirement
        cafeData.wifi_password_required = wifiLower.includes('password') || wifiLower.includes('pass')
      } else {
        cafeData.wifi_available = true // Default to true
        cafeData.wifi_speed_rating = null
      }

      // Power outlets
      if (submission.power_notes) {
        cafeData.power_outlets_available = true
        const powerLower = submission.power_notes.toLowerCase()
        // Try to infer rating
        if (powerLower.includes('plenty') || powerLower.includes('many') || powerLower.includes('5')) {
          cafeData.power_outlet_rating = 5
        } else if (powerLower.includes('some') || powerLower.includes('4')) {
          cafeData.power_outlet_rating = 4
        } else if (powerLower.includes('few') || powerLower.includes('limited') || powerLower.includes('3')) {
          cafeData.power_outlet_rating = 3
        } else {
          cafeData.power_outlet_rating = 4 // Default
        }
      } else {
        cafeData.power_outlets_available = false // Default to false
      }

      // Noise level
      if (submission.noise_notes) {
        const noiseLower = submission.noise_notes.toLowerCase()
        if (noiseLower.includes('quiet')) {
          cafeData.noise_level = 'quiet'
        } else if (noiseLower.includes('loud') || noiseLower.includes('noisy')) {
          cafeData.noise_level = 'loud'
        } else if (noiseLower.includes('variable') || noiseLower.includes('varies')) {
          cafeData.noise_level = 'variable'
        } else {
          cafeData.noise_level = 'moderate' // Default
        }
      } else {
        cafeData.noise_level = 'moderate' // Default
      }

      // Time limit
      if (submission.time_limit_notes) {
        const timeLower = submission.time_limit_notes.toLowerCase()
        // Check for time limits mentioned
        if (timeLower.includes('no limit') || timeLower.includes('unlimited') || timeLower.includes('no time')) {
          cafeData.time_limit_minutes = null
          cafeData.laptop_policy = 'unlimited'
        } else {
          // Try to extract time limit (e.g., "2h", "90min", "2 hour")
          const hourMatch = timeLower.match(/(\d+)\s*h/i)
          const minMatch = timeLower.match(/(\d+)\s*min/i)
          if (hourMatch) {
            cafeData.time_limit_minutes = parseInt(hourMatch[1]) * 60
          } else if (minMatch) {
            cafeData.time_limit_minutes = parseInt(minMatch[1])
          } else {
            // Default to 2 hours if limit mentioned but not specified
            cafeData.time_limit_minutes = 120
          }
          cafeData.laptop_policy = 'restricted'
        }
      } else {
        cafeData.time_limit_minutes = null // Default to no limit
        cafeData.laptop_policy = 'unlimited'
      }

      // Create cafe entry
      const { data: createdCafe, error: cafeError } = await supabase
        .from('cafes')
        .insert([cafeData])
        .select()
        .single()

      if (cafeError) {
        // If error is due to missing columns, try with minimal fields
        if (cafeError.message?.includes('column') || cafeError.code === '42703') {
          console.warn('Some fields not available in schema, using minimal fields')
          const minimalData: any = {
            name: submission.name,
            city: submission.city,
            address: submission.address,
            country: 'DE',
            is_active: true,
            is_verified: false,
          }
          if (submission.website) minimalData.website = submission.website
          if (submission.notes) minimalData.description = submission.notes

          const { data: retryCafe, error: retryError } = await supabase
            .from('cafes')
            .insert([minimalData])
            .select()
            .single()

          if (retryError) throw retryError

          // Update submission with retry cafe
          const { error: updateError } = await supabase
            .from('submissions')
            .update({
              status: 'approved',
              cafe_id: retryCafe.id,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', submission.id)

          if (updateError) throw updateError
        } else {
          throw cafeError
        }
      } else {
        // Update submission status
        const { error: updateError } = await supabase
          .from('submissions')
          .update({
            status: 'approved',
            cafe_id: createdCafe.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', submission.id)

        if (updateError) throw updateError
      }

      // Refresh submissions list
      fetchSubmissions()
      alert(`Successfully approved "${submission.name}" and created café entry!`)
    } catch (err: any) {
      console.error('Error approving submission:', err)
      alert(`Failed to approve submission: ${err.message || 'Unknown error'}`)
    }
  }

  const handleReject = async (submissionId: string) => {
    const notes = prompt('Reason for rejection (optional):')
    if (notes === null) return // User cancelled

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', submissionId)

      if (error) throw error

      fetchSubmissions()
    } catch (err: any) {
      console.error('Error rejecting submission:', err)
      alert(`Failed to reject submission: ${err.message || 'Unknown error'}`)
    }
  }

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true
    return sub.status === filter
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading submissions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Café Submissions</h1>
            <p className="mt-2 text-gray-600">Review and approve café suggestions from users</p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === status
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {submissions.filter((s) => s.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            No {filter !== 'all' ? filter : ''} submissions found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {submission.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        submission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : submission.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {submission.status}
                    </span>
                    {submission.cafe_id && (
                      <Link
                        href={`/cafe/${submission.cafe_id}`}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        View Café →
                      </Link>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Location:</span> {submission.address},{' '}
                      {submission.city}
                    </p>
                    {submission.website && (
                      <p>
                        <span className="font-medium">Website:</span>{' '}
                        <a
                          href={submission.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {submission.website}
                        </a>
                      </p>
                    )}
                    {submission.google_maps_url && (
                      <p>
                        <span className="font-medium">Google Maps:</span>{' '}
                        <a
                          href={submission.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          View on Maps
                        </a>
                      </p>
                    )}
                    {submission.submitter_email && (
                      <p>
                        <span className="font-medium">Submitter Email:</span>{' '}
                        <a
                          href={`mailto:${submission.submitter_email}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {submission.submitter_email}
                        </a>
                      </p>
                    )}
                    {submission.notes && (
                      <p>
                        <span className="font-medium">Notes:</span> {submission.notes}
                      </p>
                    )}
                    {(submission.wifi_notes || submission.power_notes || submission.noise_notes || submission.time_limit_notes) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="font-medium text-gray-900 mb-2">Laptop Friendliness:</p>
                        {submission.wifi_notes && (
                          <p className="mb-1">
                            <span className="font-medium">WiFi:</span> {submission.wifi_notes}
                          </p>
                        )}
                        {submission.power_notes && (
                          <p className="mb-1">
                            <span className="font-medium">Power Outlets:</span> {submission.power_notes}
                          </p>
                        )}
                        {submission.noise_notes && (
                          <p className="mb-1">
                            <span className="font-medium">Noise:</span> {submission.noise_notes}
                          </p>
                        )}
                        {submission.time_limit_notes && (
                          <p className="mb-1">
                            <span className="font-medium">Time Limit:</span> {submission.time_limit_notes}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted: {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                    {submission.reviewed_at && (
                      <p className="text-xs text-gray-500">
                        Reviewed: {new Date(submission.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {submission.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(submission)}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(submission.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
