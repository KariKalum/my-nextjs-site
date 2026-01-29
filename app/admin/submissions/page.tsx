'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { getCafeHref } from '@/lib/cafeRouting'

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
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<{ message: string; step?: string; requestId?: string } | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [filter])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
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

  const callDecisionApi = async (
    submissionId: string,
    decision: 'approve' | 'reject',
    reviewNotes?: string
  ): Promise<{ ok: boolean; requestId?: string; step?: string; error?: { message: string; code?: string } }> => {
    const res = await fetch(`/api/admin/submissions/${submissionId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, review_notes: reviewNotes || undefined }),
    })
    const json = await res.json()
    if (!res.ok) {
      return {
        ok: false,
        requestId: json.requestId,
        step: json.step,
        error: json.error,
      }
    }
    return { ok: true, requestId: json.requestId }
  }

  const handleApprove = async (submission: Submission, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!confirm(`Approve "${submission.name}" and create a café entry?`)) return
    setErrorBanner(null)
    setSuccessBanner(null)
    setActionId(submission.id)
    try {
      const result = await callDecisionApi(submission.id, 'approve')
      if (!result.ok) {
        setErrorBanner({
          message: result.error?.message || 'Approve failed',
          step: result.step,
          requestId: result.requestId,
        })
        return
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id))
      router.refresh()
      setSuccessBanner('Approved')
      setActionId(null)
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch (err: any) {
      setErrorBanner({
        message: err?.message || 'Approve failed',
        requestId: undefined,
      })
      setActionId(null)
    }
  }

  const handleReject = async (submissionId: string, submissionName: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const notes = prompt('Reason for rejection (optional):')
    if (notes === null) return
    setErrorBanner(null)
    setSuccessBanner(null)
    setActionId(submissionId)
    try {
      const result = await callDecisionApi(submissionId, 'reject', notes || undefined)
      if (!result.ok) {
        setErrorBanner({
          message: result.error?.message || 'Reject failed',
          step: result.step,
          requestId: result.requestId,
        })
        return
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId))
      router.refresh()
      setSuccessBanner('Rejected')
      setActionId(null)
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch (err: any) {
      setErrorBanner({
        message: err?.message || 'Reject failed',
        requestId: undefined,
      })
      setActionId(null)
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

      {/* Success banner */}
      {successBanner && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {successBanner}
        </div>
      )}

      {/* Error banner (decision API failure) */}
      {errorBanner && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <p className="font-medium">{errorBanner.message}</p>
          {(errorBanner.step ?? errorBanner.requestId) && (
            <p className="mt-1 text-xs opacity-90">
              {[errorBanner.step && `Step: ${errorBanner.step}`, errorBanner.requestId && `Request: ${errorBanner.requestId}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
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
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/admin/submissions/${submission.id}`}
                  className="flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset rounded"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-primary-600">
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
                        href={getCafeHref({ id: submission.cafe_id })}
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
                </Link>

                {submission.status === 'pending' && (
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button
                      onClick={(e) => handleApprove(submission, e)}
                      disabled={actionId === submission.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => handleReject(submission.id, submission.name, e)}
                      disabled={actionId === submission.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
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
