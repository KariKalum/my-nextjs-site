'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { getCafeHref } from '@/lib/cafeRouting'

type EditSuggestion = {
  id: string
  cafe_id: string
  user_id: string | null
  email: string | null
  changes: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

type CafeName = { id: string; name: string }

export default function AdminEditSuggestionsPage() {
  const router = useRouter()
  const [allSuggestions, setAllSuggestions] = useState<EditSuggestion[]>([])
  const [cafeNames, setCafeNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<{ message: string; step?: string; requestId?: string } | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('cafe_edit_suggestions')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const list = (data as EditSuggestion[]) || []
      setAllSuggestions(list)
      setError(null)

      if (list.length > 0) {
        const ids = Array.from(new Set(list.map((s) => s.cafe_id)))
        const { data: cafes } = await supabase
          .from('cafes')
          .select('id, name')
          .in('id', ids)
        const map: Record<string, string> = {}
        ;(cafes as CafeName[] || []).forEach((c) => { map[c.id] = c.name })
        setCafeNames(map)
      } else {
        setCafeNames({})
      }
    } catch (err) {
      console.error('Error fetching edit suggestions:', err)
      setError('Failed to load edit suggestions')
      setAllSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  const filteredSuggestions = allSuggestions.filter((s) => s.status === filter)

  const callDecisionApi = async (
    id: string,
    decision: 'approve' | 'reject',
    reviewNotes?: string
  ): Promise<{ ok: boolean; requestId?: string; step?: string; error?: { message: string } }> => {
    const res = await fetch(`/api/admin/edit-suggestions/${id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, review_notes: reviewNotes || undefined }),
    })
    const json = await res.json()
    if (!res.ok) return { ok: false, requestId: json.requestId, step: json.step, error: json.error }
    return { ok: true, requestId: json.requestId }
  }

  const handleApprove = async (suggestion: EditSuggestion) => {
    setErrorBanner(null)
    setSuccessBanner(null)
    setActionId(suggestion.id)
    try {
      const result = await callDecisionApi(suggestion.id, 'approve')
      if (!result.ok) {
        setErrorBanner({
          message: result.error?.message || 'Approve failed',
          step: result.step,
          requestId: result.requestId,
        })
        return
      }
      setAllSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
      router.refresh()
      setSuccessBanner('Approved')
      setActionId(null)
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch (err: any) {
      setErrorBanner({ message: err?.message || 'Approve failed' })
      setActionId(null)
    }
  }

  const handleReject = async (suggestion: EditSuggestion) => {
    const notes = prompt('Reason for rejection (optional):')
    if (notes === null) return
    setErrorBanner(null)
    setSuccessBanner(null)
    setActionId(suggestion.id)
    try {
      const result = await callDecisionApi(suggestion.id, 'reject', notes || undefined)
      if (!result.ok) {
        setErrorBanner({
          message: result.error?.message || 'Reject failed',
          step: result.step,
          requestId: result.requestId,
        })
        return
      }
      setAllSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
      router.refresh()
      setSuccessBanner('Rejected')
      setActionId(null)
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch (err: any) {
      setErrorBanner({ message: err?.message || 'Reject failed' })
      setActionId(null)
    }
  }

  const changesPreview = (changes: Record<string, unknown>) => {
    try {
      return JSON.stringify(changes, null, 2)
    } catch {
      return String(changes)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading edit suggestions...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Suggestions</h1>
            <p className="mt-2 text-gray-600">Review suggested edits to café listings</p>
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
                {allSuggestions.filter((s) => s.status === status).length}
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

      {filteredSuggestions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No {filter} edit suggestions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/edit-suggestions/${s.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/edit-suggestions/${s.id}`)}
                  className="flex-1 min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset rounded"
                >
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-500">Café</span>
                    <span className="text-primary-600 font-medium">
                      {cafeNames[s.cafe_id] || s.cafe_id}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        s.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : s.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    Created: {new Date(s.created_at).toLocaleString()}
                  </p>
                  {s.email && (
                    <p className="text-sm text-gray-600 mb-2" onClick={(e) => e.stopPropagation()}>
                      Email: <a href={`mailto:${s.email}`} className="text-primary-600 hover:text-primary-700">{s.email}</a>
                    </p>
                  )}
                  <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto max-h-40 overflow-y-auto">
                    {changesPreview(s.changes || {})}
                  </pre>
                </div>
                {s.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(s)}
                      disabled={actionId === s.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(s)}
                      disabled={actionId === s.id}
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
