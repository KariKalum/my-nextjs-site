'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

type CafeReview = {
  id: string
  cafe_id: string
  user_id: string | null
  email: string | null
  rating: number | null
  review_text: string | null
  kind: string
  status: string
  review_notes: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  evidence: Record<string, unknown> | null
}

type CafeRow = { id: string; name: string; city: string | null } | null

export default function AdminReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [review, setReview] = useState<CafeReview | null>(null)
  const [cafe, setCafe] = useState<CafeRow>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<{ message: string; step?: string; requestId?: string } | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from('cafe_reviews')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data: rev, error: e1 }) => {
        if (e1 || !rev) {
          setError(e1?.message || 'Review not found')
          setReview(null)
          setCafe(null)
          return
        }
        setReview(rev as CafeReview)
        return supabase.from('cafes').select('id, name, city').eq('id', (rev as CafeReview).cafe_id).single()
      })
      .then((res: unknown) => {
        const r = res as { data?: CafeRow; error?: unknown }
        if (r?.data) setCafe(r.data)
        if (r?.error) setCafe(null)
      })
      .then(() => setLoading(false), () => setLoading(false))
  }, [id])

  const callDecisionApi = async (
    reviewId: string,
    decision: 'approve' | 'reject',
    reviewNotes?: string
  ): Promise<{ ok: boolean; requestId?: string; step?: string; error?: { message: string } }> => {
    const res = await fetch(`/api/admin/reviews/${reviewId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, review_notes: reviewNotes || undefined }),
    })
    const json = await res.json()
    if (!res.ok) return { ok: false, requestId: json.requestId, step: json.step, error: json.error }
    return { ok: true, requestId: json.requestId }
  }

  const handleApprove = async () => {
    if (!review) return
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
        setActionId(null)
        return
      }
      setSuccessBanner('Approved')
      setReview((prev) => (prev ? { ...prev, status: 'approved' } : null))
      setActionId(null)
      setTimeout(() => setSuccessBanner(null), 4000)
      router.refresh()
    } catch (err: unknown) {
      setErrorBanner({ message: err instanceof Error ? err.message : 'Approve failed' })
      setActionId(null)
    }
  }

  const handleReject = async () => {
    if (!review) return
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
        setActionId(null)
        return
      }
      setSuccessBanner('Rejected')
      setReview((prev) => (prev ? { ...prev, status: 'rejected' } : null))
      setActionId(null)
      setTimeout(() => setSuccessBanner(null), 4000)
      router.refresh()
    } catch (err: unknown) {
      setErrorBanner({ message: err instanceof Error ? err.message : 'Reject failed' })
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading review...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-red-600">{error || 'Review not found'}</p>
          <Link href="/admin/reviews" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
            ← Back to Reviews
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/admin/reviews" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to Reviews
        </Link>
      </div>

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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review detail</h1>
              <p className="text-sm text-gray-500 mt-1">
                Café: <span className="font-medium text-gray-700">{cafe?.name ?? review.cafe_id}</span>
                {cafe?.city && <span className="ml-2 text-gray-500">({cafe.city})</span>}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                review.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : review.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {review.status}
            </span>
          </div>
        </div>

        <dl className="p-6 space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Kind</dt>
            <dd className="mt-1 text-gray-900">{review.kind}</dd>
          </div>
          {review.rating != null && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Rating</dt>
              <dd className="mt-1 text-gray-900">⭐ {review.rating}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Review / message</dt>
            <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{review.review_text || '—'}</dd>
          </div>
          {review.email && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${review.email}`} className="text-primary-600 hover:text-primary-700">
                  {review.email}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-gray-900">{new Date(review.created_at).toLocaleString()}</dd>
          </div>
          {review.reviewed_at && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Reviewed at</dt>
              <dd className="mt-1 text-gray-900">{new Date(review.reviewed_at).toLocaleString()}</dd>
            </div>
          )}
          {review.review_notes && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Review notes</dt>
              <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{review.review_notes}</dd>
            </div>
          )}
          {review.evidence && Object.keys(review.evidence).length > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Evidence</dt>
              <dd className="mt-1">
                <pre className="text-sm bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">
                  {JSON.stringify(review.evidence, null, 2)}
                </pre>
              </dd>
            </div>
          )}
        </dl>

        {review.status === 'pending' && (
          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={handleApprove}
              disabled={actionId === review.id}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={actionId === review.id}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
