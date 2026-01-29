'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
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
  updated_at?: string
}

const FIELDS: { key: keyof Submission; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'address', label: 'Address' },
  { key: 'website', label: 'Website' },
  { key: 'google_maps_url', label: 'Google Maps URL' },
  { key: 'notes', label: 'Notes' },
  { key: 'wifi_notes', label: 'WiFi notes' },
  { key: 'power_notes', label: 'Power notes' },
  { key: 'noise_notes', label: 'Noise notes' },
  { key: 'time_limit_notes', label: 'Time limit notes' },
  { key: 'submitter_email', label: 'Submitter email' },
  { key: 'created_at', label: 'Created at' },
  { key: 'status', label: 'Status' },
  { key: 'review_notes', label: 'Review notes' },
  { key: 'reviewed_at', label: 'Reviewed at' },
  { key: 'cafe_id', label: 'Cafe ID' },
]

export default function AdminSubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<{ message: string; step?: string; requestId?: string } | null>(null)
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message || 'Failed to load submission')
          setSubmission(null)
          return
        }
        setSubmission(data as Submission)
        setError(null)
      })
      .then(() => setLoading(false), () => setLoading(false))
  }, [id])

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

  const handleApprove = async () => {
    if (!submission) return
    if (!confirm(`Approve "${submission.name}" and create a café entry?`)) return
    setErrorBanner(null)
    setSuccessBanner(null)
    setActioning(true)
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
      router.refresh()
      setSuccessBanner('Approved')
      setSubmission((prev) => (prev ? { ...prev, status: 'approved' as const } : null))
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch (err: any) {
      setErrorBanner({ message: err?.message || 'Approve failed', requestId: undefined })
    } finally {
      setActioning(false)
    }
  }

  const handleReject = async () => {
    if (!submission) return
    const notes = prompt('Reason for rejection (optional):')
    if (notes === null) return
    setErrorBanner(null)
    setSuccessBanner(null)
    setActioning(true)
    try {
      const result = await callDecisionApi(submission.id, 'reject', notes || undefined)
      if (!result.ok) {
        setErrorBanner({
          message: result.error?.message || 'Reject failed',
          step: result.step,
          requestId: result.requestId,
        })
        return
      }
      router.refresh()
      setSuccessBanner('Rejected')
      setSubmission((prev) => (prev ? { ...prev, status: 'rejected' as const } : null))
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch (err: any) {
      setErrorBanner({ message: err?.message || 'Reject failed', requestId: undefined })
    } finally {
      setActioning(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
        <p className="mt-4 text-center text-gray-600">Loading submission...</p>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p>{error || 'Submission not found.'}</p>
        </div>
        <Link href="/admin/submissions" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          ← Back to submissions
        </Link>
      </div>
    )
  }

  const formatValue = (key: keyof Submission, value: unknown): string => {
    if (value == null || value === '') return '—'
    if (key === 'created_at' || key === 'reviewed_at') {
      return new Date(value as string).toLocaleString()
    }
    if (key === 'website' || key === 'google_maps_url') {
      return value as string
    }
    return String(value)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/submissions" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to submissions
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
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{submission.name}</h1>
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
        </div>

        <dl className="divide-y divide-gray-200">
          {FIELDS.map(({ key, label }) => {
            const value = submission[key]
            const display = formatValue(key, value)
            const isLink =
              (key === 'website' || key === 'google_maps_url') && value && String(value).startsWith('http')
            return (
              <div key={key} className="px-6 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {isLink ? (
                    <a
                      href={String(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {display}
                    </a>
                  ) : key === 'cafe_id' && value ? (
                    <Link href={getCafeHref({ id: String(value) })} className="text-primary-600 hover:text-primary-700">
                      {display} →
                    </Link>
                  ) : (
                    display
                  )}
                </dd>
              </div>
            )
          })}
        </dl>

        {submission.status === 'pending' && (
          <div className="px-6 py-4 border-t border-gray-200 flex gap-2">
            <button
              onClick={handleApprove}
              disabled={actioning}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={actioning}
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
