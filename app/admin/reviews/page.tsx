'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

type CafeReview = {
  id: string
  cafe_id: string
  user_id: string | null
  email: string | null
  rating: number | null
  review_text: string | null
  kind: string
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

type CafeName = { id: string; name: string }

export default function AdminReviewsPage() {
  const router = useRouter()
  const [allReviews, setAllReviews] = useState<CafeReview[]>([])
  const [cafeNames, setCafeNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<{ message: string; step?: string; requestId?: string } | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('cafe_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const list = (data as CafeReview[]) || []
      setAllReviews(list)
      setError(null)

      if (list.length > 0) {
        const ids = Array.from(new Set(list.map((r) => r.cafe_id)))
        const { data: cafes } = await supabase
          .from('cafes')
          .select('id, name')
          .in('id', ids)
        const map: Record<string, string> = {}
        ;(cafes as CafeName[] || []).forEach((c) => {
          map[c.id] = c.name
        })
        setCafeNames(map)
      } else {
        setCafeNames({})
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews')
      setAllReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const filteredReviews = allReviews.filter((r) => r.status === filter)

  const callDecisionApi = async (
    id: string,
    decision: 'approve' | 'reject',
    reviewNotes?: string
  ): Promise<{ ok: boolean; requestId?: string; step?: string; error?: { message: string } }> => {
    const res = await fetch(`/api/admin/reviews/${id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, review_notes: reviewNotes || undefined }),
    })
    const json = await res.json()
    if (!res.ok) return { ok: false, requestId: json.requestId, step: json.step, error: json.error }
    return { ok: true, requestId: json.requestId }
  }

  const handleApprove = async (review: CafeReview) => {
    setErrorBanner(null)
    setSuccessBanner(null)
    setActionId(review.id)
    try {
      const result = await callDecisionApi(review.id, 'approve')
      if (!result.ok) {
        setErrorBanner({
          message: result.error?.message || 'Approve failed',
          step: result.step,
          requestId: result.requestId,
        })
        return
      }
      setAllReviews((prev) => prev.filter((r) => r.id !== review.id))
      router.refresh()
      setSuccessBanner('Approved')
      setActionId(null)
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch (err: unknown) {
      setErrorBanner({ message: err instanceof Error ? err.message : 'Approve failed' })
      setActionId(null)
    }
  }

  const handleReject = async (review: CafeReview) => {
    const notes = prompt('Reason for rejection (optional):')
    if (notes === null) return
    setErrorBanner(null)
    setSuccessBanner(null)
    setActionId(review.id)
    try {
      const result = await callDecisionApi(review.id, 'reject', notes || undefined)
      if (!result.ok) {
        setErrorBanner({
          message: result.error?.message || 'Reject failed',
          step: result.step,
          requestId: result.requestId,
        })
        return
      }
      setAllReviews((prev) => prev.filter((r) => r.id !== review.id))
      router.refresh()
      setSuccessBanner('Rejected')
      setActionId(null)
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch (err: unknown) {
      setErrorBanner({ message: err instanceof Error ? err.message : 'Reject failed' })
      setActionId(null)
    }
  }

  const snippet = (text: string | null, maxLen: number = 80) => {
    if (!text || !text.trim()) return '—'
    const t = text.trim()
    return t.length <= maxLen ? t : t.slice(0, maxLen) + '…'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
            <p className="mt-2 text-gray-600">Moderate café reviews, reports, and quick feedback</p>
          </div>
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex space-x-4 border-b border-gray-200">
          {(['pending', 'approved', 'rejected'] as const).map((status) => (
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
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {allReviews.filter((r) => r.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {successBanner && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {successBanner}
        </div>
      )}

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

      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No {filter} reviews.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/reviews/${r.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/reviews/${r.id}`)}
                  className="flex-1 min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset rounded"
                >
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-500">Café</span>
                    <span className="text-primary-600 font-medium">
                      {cafeNames[r.cafe_id] || r.cafe_id}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        r.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : r.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {r.kind}
                    </span>
                    {r.rating != null && (
                      <span className="text-sm text-gray-600">⭐ {r.rating}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    Created: {new Date(r.created_at).toLocaleString()}
                  </p>
                  {r.email && (
                    <p className="text-sm text-gray-600 mb-2" onClick={(e) => e.stopPropagation()}>
                      Email: <a href={`mailto:${r.email}`} className="text-primary-600 hover:text-primary-700">{r.email}</a>
                    </p>
                  )}
                  <p className="text-sm text-gray-700">{snippet(r.review_text)}</p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(r) }}
                      disabled={actionId === r.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReject(r) }}
                      disabled={actionId === r.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
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
