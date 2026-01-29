'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

/* ----- Inline admin UI (Tailwind only) ----- */
function AdminPageShell({
  title,
  subtitle,
  actions,
}: { title: React.ReactNode; subtitle: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}

function AdminTabs<T extends string>({
  tabs,
  activeId,
  onChange,
}: {
  tabs: { id: T; label: string; count: number }[]
  activeId: T
  onChange: (id: T) => void
}) {
  return (
    <nav className="flex gap-0.5 p-1 bg-gray-100 rounded-lg w-full sm:w-auto" aria-label="Status tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
            activeId === tab.id
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {tab.label}
          <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
            {tab.count}
          </span>
        </button>
      ))}
    </nav>
  )
}

function AdminCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}>
      {children}
    </div>
  )
}

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <AdminCard className="p-12">
          <div className="flex flex-col items-center justify-center min-h-[280px] text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">Loading reviews…</p>
          </div>
        </AdminCard>
      </div>
    )
  }

  const tabItems = [
    { id: 'pending' as const, label: 'Pending', count: allReviews.filter((r) => r.status === 'pending').length },
    { id: 'approved' as const, label: 'Approved', count: allReviews.filter((r) => r.status === 'approved').length },
    { id: 'rejected' as const, label: 'Rejected', count: allReviews.filter((r) => r.status === 'rejected').length },
  ]

  const emptyMessages: Record<typeof filter, string> = {
    pending: 'No pending reviews. All caught up!',
    approved: 'No approved reviews yet.',
    rejected: 'No rejected reviews.',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <AdminPageShell
        title="Reviews"
        subtitle="Moderate café reviews, reports, and quick feedback"
        actions={
          <Link
            href="/admin"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to dashboard
          </Link>
        }
      />

      <div className="mb-6">
        <AdminTabs tabs={tabItems} activeId={filter} onChange={setFilter} />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
          {error}
        </div>
      )}

      {successBanner && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-sm text-green-800">
          {successBanner}
        </div>
      )}

      {errorBanner && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
          <p className="font-medium">{errorBanner.message}</p>
          {(errorBanner.step ?? errorBanner.requestId) && (
            <p className="mt-1 text-xs text-red-700 opacity-90">
              {[errorBanner.step && `Step: ${errorBanner.step}`, errorBanner.requestId && `Request: ${errorBanner.requestId}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      )}

      {filteredReviews.length === 0 ? (
        <AdminCard className="p-12 text-center">
          <p className="text-gray-500">{emptyMessages[filter]}</p>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((r) => (
            <AdminCard key={r.id} className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/reviews/${r.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/reviews/${r.id}`)}
                  className="flex-1 min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset rounded-lg"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-gray-900">
                      {cafeNames[r.cafe_id] || r.cafe_id}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {r.kind}
                    </span>
                    {r.rating != null && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-800">
                        ★ {r.rating}/5
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                  {r.email && (
                    <p className="text-xs text-gray-600 mb-2" onClick={(e) => e.stopPropagation()}>
                      <a href={`mailto:${r.email}`} className="text-primary-600 hover:text-primary-700 underline">
                        {r.email}
                      </a>
                    </p>
                  )}
                  <p className="text-sm text-gray-700">{snippet(r.review_text)}</p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 sm:pl-4">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleApprove(r) }}
                      disabled={actionId === r.id}
                      className="order-2 sm:order-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleReject(r) }}
                      disabled={actionId === r.id}
                      className="order-1 sm:order-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}
