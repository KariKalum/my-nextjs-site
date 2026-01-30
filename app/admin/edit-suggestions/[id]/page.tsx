'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { getCafeHref } from '@/lib/cafeRouting'
import { ALLOWED_CAFE_FIELDS_SET, NON_APPLYABLE_KEYS } from '@/lib/edit-suggestions-fields'

type EditSuggestion = {
  id: string
  cafe_id: string
  status: string
  changes: Record<string, unknown>
  email: string | null
  created_at: string
  review_notes: string | null
  reviewed_at: string | null
}

type CafeRow = Record<string, unknown>

const FIELD_LABELS: Record<string, string> = {
  hours: 'Hours',
  website: 'Website',
  ai_noise_level: 'Noise level',
  ai_laptop_policy: 'Time limit',
  is_work_friendly: 'Laptop friendly',
  ai_wifi_quality: 'WiFi quality',
  ai_power_outlets: 'Power outlets',
  name: 'Name',
  description: 'Description',
  address: 'Address',
  city: 'City',
  state: 'State',
  zip_code: 'Zip code',
  country: 'Country',
  phone: 'Phone',
  email: 'Email',
  latitude: 'Latitude',
  longitude: 'Longitude',
  google_maps_url: 'Google Maps URL',
  google_rating: 'Google rating',
  google_ratings_total: 'Google ratings total',
  price_level: 'Price level',
  business_status: 'Business status',
  work_score: 'Work score',
  ai_score: 'AI score',
  ai_confidence: 'AI confidence',
  is_active: 'Active',
  is_verified: 'Verified',
  updated_at: 'Updated at',
}

function formatVal(val: unknown): string {
  if (val == null || val === '') return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

/** Render value for Current/Suggested: — for null, text for primitives, scrollable <pre> for JSON. */
function ValueDisplay({ val }: { val: unknown }) {
  if (val == null || val === undefined) return <span className="text-gray-400">—</span>
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return <span className="whitespace-pre-wrap break-words">{String(val)}</span>
  }
  if (typeof val === 'object') {
    return (
      <pre className="max-h-32 overflow-auto rounded bg-gray-50 border border-gray-200 p-2 text-xs text-gray-800">
        {JSON.stringify(val, null, 2)}
      </pre>
    )
  }
  return <span>{String(val)}</span>
}

export default function AdminEditSuggestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [suggestion, setSuggestion] = useState<EditSuggestion | null>(null)
  const [cafe, setCafe] = useState<CafeRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyChecked, setApplyChecked] = useState<Record<string, boolean>>({})
  const [reviewNotes, setReviewNotes] = useState('')
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<{ message: string; step?: string; requestId?: string } | null>(null)
  const [applying, setApplying] = useState(false)
  const [applyingSelective, setApplyingSelective] = useState(false)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from('cafe_edit_suggestions')
      .select('id, cafe_id, status, changes, email, created_at, review_notes, reviewed_at')
      .eq('id', id)
      .single()
      .then(({ data: sug, error: e1 }) => {
        if (e1 || !sug) {
          setError(e1?.message || 'Suggestion not found')
          setSuggestion(null)
          setCafe(null)
          return
        }
        setSuggestion(sug as EditSuggestion)
        setReviewNotes((sug as EditSuggestion).review_notes || '')
        const changes = (sug as EditSuggestion).changes || {}
        const initial: Record<string, boolean> = {}
        for (const key of Object.keys(changes)) {
          if (NON_APPLYABLE_KEYS.has(key)) continue
          initial[key] = ALLOWED_CAFE_FIELDS_SET.has(key)
        }
        setApplyChecked(initial)
        return supabase.from('cafes').select('*').eq('id', (sug as EditSuggestion).cafe_id).single()
      })
      .then((res: any) => {
        if (res?.data) setCafe(res.data as CafeRow)
        if (res?.error) setCafe(null)
      })
      .then(() => setLoading(false), () => setLoading(false))
  }, [id])

  const handleApplySelected = async () => {
    if (!suggestion) return
    const selectedKeys = Object.keys(applyChecked).filter(
      (key) => applyChecked[key] && ALLOWED_CAFE_FIELDS_SET.has(key) && key in (suggestion.changes || {})
    )
    if (selectedKeys.length === 0) return
    setErrorBanner(null)
    setSuccessBanner(null)
    setApplyingSelective(true)
    try {
      const res = await fetch('/api/admin/edit-suggestions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          cafeId: suggestion.cafe_id,
          selectedKeys,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        const appliedKeys = data.applied && typeof data.applied === 'object' ? Object.keys(data.applied) : selectedKeys
        setSuccessBanner(`Applied: ${appliedKeys.join(', ')}`)
        setSuggestion((prev) => (prev ? { ...prev, status: 'approved' } : null))
        router.refresh()
        setTimeout(() => setSuccessBanner(null), 4000)
      } else {
        setErrorBanner({
          message: data?.error?.message ?? 'Apply failed',
          step: data?.step,
          requestId: data?.requestId,
        })
      }
    } catch (err: unknown) {
      setErrorBanner({ message: err instanceof Error ? err.message : 'Apply failed' })
    } finally {
      setApplyingSelective(false)
    }
  }

  const handleApply = async () => {
    if (!suggestion) return
    const acceptedChanges: Record<string, unknown> = {}
    for (const [key, checked] of Object.entries(applyChecked)) {
      if (checked && ALLOWED_CAFE_FIELDS_SET.has(key) && suggestion.changes && key in suggestion.changes) {
        acceptedChanges[key] = suggestion.changes[key]
      }
    }
    const decision = Object.keys(acceptedChanges).length > 0 ? 'approve' : 'reject'
    setErrorBanner(null)
    setSuccessBanner(null)
    setApplying(true)
    try {
      const res = await fetch(`/api/admin/edit-suggestions/${suggestion.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          review_notes: reviewNotes.trim() || undefined,
          accepted_changes: Object.keys(acceptedChanges).length > 0 ? acceptedChanges : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setSuccessBanner(decision === 'approve' ? 'Changes applied.' : 'Suggestion rejected.')
        setSuggestion((prev) => (prev ? { ...prev, status: decision === 'approve' ? 'approved' : 'rejected' } : null))
        router.refresh()
        setTimeout(() => setSuccessBanner(null), 4000)
      } else {
        setErrorBanner({
          message: data?.error?.message || 'Request failed',
          step: data?.step,
          requestId: data?.requestId,
        })
      }
    } catch (err: unknown) {
      setErrorBanner({ message: err instanceof Error ? err.message : 'Request failed' })
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>
        <p className="mt-4 text-center text-gray-600">Loading…</p>
      </div>
    )
  }

  if (error || !suggestion) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error || 'Not found.'}</div>
        <Link href="/admin/edit-suggestions" className="mt-4 inline-block text-primary-600 hover:text-primary-700">← Back to edit suggestions</Link>
      </div>
    )
  }

  const changes = suggestion.changes || {}
  const applyableKeys = Object.keys(changes).filter((k) => !NON_APPLYABLE_KEYS.has(k))
  const evidenceVal = changes.evidence ?? changes.comment ?? changes.note

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/edit-suggestions" className="text-sm text-gray-600 hover:text-gray-900">← Back to edit suggestions</Link>
      </div>

      {successBanner && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{successBanner}</div>
      )}
      {errorBanner && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <p className="font-medium">{errorBanner.message}</p>
          {(errorBanner.step ?? errorBanner.requestId) && (
            <p className="mt-1 text-xs opacity-90">
              {[errorBanner.step && `Step: ${errorBanner.step}`, errorBanner.requestId && `Request: ${errorBanner.requestId}`].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Edit suggestion</h1>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : suggestion.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{suggestion.status}</span>
          <Link href={getCafeHref({ id: suggestion.cafe_id })} className="text-sm text-primary-600 hover:text-primary-700">View café ›</Link>
          {suggestion.email && <a href={`mailto:${suggestion.email}`} className="text-sm text-gray-600">{suggestion.email}</a>}
          <span className="text-xs text-gray-500">Created: {new Date(suggestion.created_at).toLocaleString()}</span>
        </div>

        {suggestion.status === 'pending' && (
          <>
            {applyableKeys.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Selective apply</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 w-10">Apply</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Field</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Current</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Suggested</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {applyableKeys.map((key) => (
                        <tr key={key}>
                          <td className="px-4 py-2 align-top pt-3">
                            {ALLOWED_CAFE_FIELDS_SET.has(key) ? (
                              <input
                                type="checkbox"
                                checked={!!applyChecked[key]}
                                onChange={(e) => setApplyChecked((prev) => ({ ...prev, [key]: e.target.checked }))}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-700">{FIELD_LABELS[key] ?? key}</td>
                          <td className="px-4 py-2 text-gray-600 max-w-xs">
                            <ValueDisplay val={cafe?.[key]} />
                          </td>
                          <td className="px-4 py-2 text-gray-900 max-w-xs">
                            <ValueDisplay val={changes[key]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleApplySelected}
                    disabled={applyingSelective || Object.keys(applyChecked).filter((k) => applyChecked[k] && ALLOWED_CAFE_FIELDS_SET.has(k) && k in changes).length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {applyingSelective ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Applying…
                      </>
                    ) : (
                      'Apply Selected'
                    )}
                  </button>
                </div>
              </div>
            )}
            {evidenceVal != null && (
              <div className="px-6 py-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-1">Evidence / comment (not applied)</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{formatVal(evidenceVal)}</p>
              </div>
            )}
            <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Review notes (optional)</label>
              <input type="text" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Optional note" className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button type="button" onClick={handleApply} disabled={applying} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50">
                {applying ? 'Applying…' : 'Apply selected changes'}
              </button>
            </div>
          </>
        )}

        {suggestion.status !== 'pending' && (
          <div className="px-6 py-4">
            <p className="text-sm text-gray-500 mb-2">This suggestion is already {suggestion.status}.</p>
            {Object.keys(changes).length > 0 && (
              <dl className="text-sm space-y-1">
                {Object.entries(changes).map(([k, v]) => (
                  <div key={k}><dt className="font-medium text-gray-700">{FIELD_LABELS[k] ?? k}</dt><dd className="text-gray-600 whitespace-pre-wrap">{formatVal(v)}</dd></div>
                ))}
              </dl>
            )}
            {evidenceVal != null && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500">Evidence / comment</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{formatVal(evidenceVal)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
