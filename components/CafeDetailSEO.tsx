'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { Cafe } from '@/src/lib/supabase/types'
import CommunityNotice from './CommunityNotice'
import CafeStructuredData from './CafeStructuredData'
import CafeFAQ from './CafeFAQ'
import CafeMapEmbed from './CafeMapEmbed'
import CafeHours from './CafeHours'
import { getAbsoluteUrl } from '@/lib/seo/metadata'
import { 
  formatAddress,
  stripWebsiteDomain, 
  getMapsUrl,
  buildCafeH1Title,
  cleanDescription
} from '@/lib/utils/cafe-display'
import { getCafeHref } from '@/lib/cafeRouting'
import { sharePage } from '@/lib/utils/share'
import {
  formatWorkScore,
  normalizeConfidence,
  normalizeUnknownToNotEnoughDataYet,
  formatPriceLevel
} from '@/lib/utils/cafe-formatters'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { Locale } from '@/lib/i18n/config'
import { prefixWithLocale } from '@/lib/i18n/routing'
import LanguageSwitcher from './LanguageSwitcher'

/** Approved review for public display (no email/user_id). */
export type ApprovedReview = {
  id?: string
  kind?: string
  rating: number | null
  review_text: string | null
  created_at: string
}

interface CafeDetailSEOProps {
  cafe: Cafe
  nearbyCafes?: Cafe[]
  approvedReviews?: ApprovedReview[]
  dict: Dictionary
  locale: Locale
}

export default function CafeDetailSEO({ cafe, nearbyCafes = [], approvedReviews = [], dict, locale }: CafeDetailSEOProps) {
  const [toast, setToast] = useState<string | null>(null)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestHours, setSuggestHours] = useState('')
  const [suggestWebsite, setSuggestWebsite] = useState('')
  const [suggestNoiseLevel, setSuggestNoiseLevel] = useState('')
  const [suggestTimeLimit, setSuggestTimeLimit] = useState('')
  const [suggestLaptopFriendly, setSuggestLaptopFriendly] = useState('')
  const [suggestWifiQuality, setSuggestWifiQuality] = useState('')
  const [suggestPowerOutlets, setSuggestPowerOutlets] = useState('')
  const [suggestEvidence, setSuggestEvidence] = useState('')
  const [suggestEmail, setSuggestEmail] = useState('')
  const [suggestMessage, setSuggestMessage] = useState<string | null>(null)
  const [suggestSubmitting, setSuggestSubmitting] = useState(false)

  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewKind, setReviewKind] = useState<'review' | 'report' | 'quick_feedback'>('review')
  const [reviewRating, setReviewRating] = useState<number | ''>('')
  const [reviewText, setReviewText] = useState('')
  const [reviewEmail, setReviewEmail] = useState('')
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const cafeUrl = getAbsoluteUrl(getCafeHref(cafe, locale))
  const mapsUrl = getMapsUrl(cafe)
  const addressLine = formatAddress(cafe)
  const h1Title = buildCafeH1Title(cafe)
  const domain = stripWebsiteDomain(cafe.website)
  const lastChecked = cafe.google_reviews_fetched_at || cafe.updated_at || null

  const handleShare = useCallback(async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : cafeUrl
    await sharePage(
      currentUrl,
      (message) => {
        setToast(message)
        setTimeout(() => setToast(null), 2000)
      }
    )
  }, [cafeUrl])

  const NOISE_LEVEL_OPTIONS = ['', 'quiet', 'moderate', 'loud', 'variable']
  const TIME_LIMIT_OPTIONS = ['', 'Unlimited', 'Restricted', 'Unknown']
  const LAPTOP_FRIENDLY_OPTIONS = ['', 'true', 'false'] // values for API; display as (unchanged), Yes, No

  function formatHoursDisplay(hours: unknown): string {
    if (hours == null) return '—'
    if (typeof hours === 'string') return hours.trim() || '—'
    if (typeof hours === 'object' && hours !== null && Array.isArray((hours as { weekday_text?: string[] }).weekday_text)) {
      return ((hours as { weekday_text: string[] }).weekday_text).join('\n')
    }
    return '—'
  }

  function formatCurrentDisplay(val: unknown): string {
    if (val == null || val === '') return '—'
    if (typeof val === 'string' && val.toLowerCase() === 'unknown') return '—'
    if (typeof val === 'boolean') return val ? 'Yes' : 'No'
    return String(val)
  }

  const handleSuggestSubmit = useCallback(async () => {
    const changes: Record<string, unknown> = {}

    const hoursVal = suggestHours.trim()
    if (hoursVal !== '') changes.hours = hoursVal

    const websiteVal = suggestWebsite.trim()
    if (websiteVal !== '') {
      try {
        new URL(websiteVal)
        changes.website = websiteVal
      } catch {
        setSuggestMessage('Please enter a valid URL for website.')
        return
      }
    }

    if (suggestNoiseLevel !== '') {
      if (!NOISE_LEVEL_OPTIONS.includes(suggestNoiseLevel)) {
        setSuggestMessage('Invalid noise level.')
        return
      }
      changes.ai_noise_level = suggestNoiseLevel
    }

    if (suggestTimeLimit !== '') {
      if (!TIME_LIMIT_OPTIONS.includes(suggestTimeLimit)) {
        setSuggestMessage('Invalid time limit.')
        return
      }
      changes.ai_laptop_policy = suggestTimeLimit
    }

    if (suggestLaptopFriendly !== '') {
      if (suggestLaptopFriendly === 'true') changes.is_work_friendly = true
      else if (suggestLaptopFriendly === 'false') changes.is_work_friendly = false
      else {
        setSuggestMessage('Invalid laptop friendly value.')
        return
      }
    }

    const wifiVal = suggestWifiQuality.trim()
    if (wifiVal !== '') changes.ai_wifi_quality = wifiVal

    const powerVal = suggestPowerOutlets.trim()
    if (powerVal !== '') changes.ai_power_outlets = powerVal

    const evidenceVal = suggestEvidence.trim()
    if (evidenceVal !== '') changes.evidence = evidenceVal

    if (Object.keys(changes).length === 0) {
      setSuggestMessage('Please fill in at least one field or add evidence/comment.')
      return
    }

    setSuggestSubmitting(true)
    setSuggestMessage(null)
    try {
      const res = await fetch('/api/edit-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafe_id: cafe.id,
          changes,
          email: suggestEmail.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setSuggestMessage('Thanks! Edit suggestion sent.')
        setSuggestHours('')
        setSuggestWebsite('')
        setSuggestNoiseLevel('')
        setSuggestTimeLimit('')
        setSuggestLaptopFriendly('')
        setSuggestWifiQuality('')
        setSuggestPowerOutlets('')
        setSuggestEvidence('')
        setSuggestEmail('')
        setTimeout(() => {
          setSuggestOpen(false)
          setSuggestMessage(null)
        }, 2000)
      } else {
        const err = data?.error?.message || data?.error || 'Request failed'
        const step = data?.step ? ` (step: ${data.step})` : ''
        const reqId = data?.requestId ? ` Request: ${data.requestId}` : ''
        setSuggestMessage(`${err}${step}${reqId}`)
      }
    } catch (err) {
      setSuggestMessage(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setSuggestSubmitting(false)
    }
  }, [
    cafe.id,
    suggestHours,
    suggestWebsite,
    suggestNoiseLevel,
    suggestTimeLimit,
    suggestLaptopFriendly,
    suggestWifiQuality,
    suggestPowerOutlets,
    suggestEvidence,
    suggestEmail,
  ])

  const handleReviewSubmit = useCallback(async () => {
    if (reviewKind === 'review') {
      const hasRating = reviewRating !== '' && Number(reviewRating) >= 1 && Number(reviewRating) <= 5
      const hasText = reviewText.trim().length > 0
      if (!hasRating && !hasText) {
        setReviewMessage('Please add a rating (1–5) or some text for your review.')
        return
      }
    } else if (!reviewText.trim()) {
      setReviewMessage('Please add some text.')
      return
    }

    setReviewSubmitting(true)
    setReviewMessage(null)
    try {
      const payload: { cafe_id: string; kind: string; rating?: number; review_text?: string; email?: string } = {
        cafe_id: cafe.id,
        kind: reviewKind,
      }
      if (reviewKind === 'review' && reviewRating !== '' && Number(reviewRating) >= 1 && Number(reviewRating) <= 5) {
        payload.rating = Number(reviewRating)
      }
      if (reviewText.trim()) payload.review_text = reviewText.trim()
      if (reviewEmail.trim()) payload.email = reviewEmail.trim()

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setReviewMessage('Thanks! Your review was submitted and will be reviewed.')
        setReviewRating('')
        setReviewText('')
        setReviewEmail('')
        setTimeout(() => {
          setReviewOpen(false)
          setReviewMessage(null)
        }, 2500)
      } else {
        const err = data?.error?.message || data?.error || 'Request failed'
        const step = data?.step ? ` (step: ${data.step})` : ''
        const reqId = data?.requestId ? ` Request: ${data.requestId}` : ''
        setReviewMessage(`${err}${step}${reqId}`)
      }
    } catch (err) {
      setReviewMessage(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setReviewSubmitting(false)
    }
  }, [cafe.id, reviewKind, reviewRating, reviewText, reviewEmail])

  const whyContent = [
    cafe.ai_evidence,
    cafe.ai_reasons,
    cafe.ai_signals,
  ].filter(Boolean).join('\n\n')

  const hasWhy = whyContent.length > 0

  return (
    <>
      <CafeStructuredData cafe={cafe} cafeUrl={cafeUrl} />

      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <ol className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                <li>
                  <Link href={prefixWithLocale('/', locale)} className="hover:text-primary-600">
                    {t(dict, 'common.home')}
                  </Link>
                </li>
                <li aria-hidden>→</li>
                <li>
                  <Link
                    href={prefixWithLocale(`/cities/${encodeURIComponent((cafe.city ?? '').toLowerCase())}`, locale)}
                    className="hover:text-primary-600"
                  >
                    {cafe.city || t(dict, 'common.cities')}
                  </Link>
                </li>
                <li aria-hidden>→</li>
                <li className="text-gray-900 font-medium" aria-current="page">
                  {cafe.name}
                </li>
              </ol>
              <LanguageSwitcher />
            </div>
          </div>
        </nav>

        <CommunityNotice dict={dict} />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* 1) Header */}
          <header className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {h1Title}
            </h1>
            <p className="text-gray-600 mb-3 break-words">{addressLine}</p>
            <div className="mb-3">
              {(cafe.is_verified ?? false) ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                  ✅ {t(dict, 'cafeDetail.verifiedBy')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
                  🕵️ {t(dict, 'cafeDetail.aiCheckedBy')}
                </span>
              )}
            </div>
          </header>

          <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 {t(dict, 'cafeDetail.description')}</h2>
            {(() => {
              const descriptionText = cafe.descriptionText || ''
              const cleanedText = descriptionText.trim()
                ? cleanDescription(
                    descriptionText,
                    cafe.city,
                    cafe.state,
                    cafe.zip_code,
                    cafe.country,
                    cafe.address
                  )
                : null
              if (!cleanedText || cleanedText.trim() === '') {
                return <p className="text-gray-500 text-sm">{t(dict, 'cafeDetail.noDescriptionYet')}</p>
              }
              return (
                <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                  {cleanedText}
                </div>
              )
            })()}
          </section>

          <div className="flex flex-wrap gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              📍 {t(dict, 'cafeDetail.openInMaps')}
            </a>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              🔗 {t(dict, 'cafeDetail.share')}
            </button>
            <button
              type="button"
              onClick={() => { setSuggestOpen((o) => !o); setSuggestMessage(null) }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              ✏️ Suggest an edit
            </button>
            <button
              type="button"
              onClick={() => { setReviewOpen((o) => !o); setReviewMessage(null) }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              ✍️ Write a review / Report
            </button>
            {toast && (
              <div
                role="status"
                aria-live="polite"
                className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium shadow-lg z-50"
              >
                {toast}
              </div>
            )}
          </div>

          {suggestOpen && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">✏️ Suggest an edit</h2>
              <p className="text-sm text-gray-600 mb-4">Current values and your suggested values. Only filled fields are submitted.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm items-center">
                <div className="font-medium text-gray-500 hidden sm:block sm:col-span-1" aria-hidden>Label</div>
                <div className="font-medium text-gray-500 hidden sm:block sm:col-span-1">Current</div>
                <div className="font-medium text-gray-500 hidden sm:block sm:col-span-1">Suggested</div>
                <div className="font-medium text-gray-700 sm:col-span-1">Hours</div>
                <div className="text-gray-700 whitespace-pre-wrap sm:col-span-1">{formatHoursDisplay(cafe.hours)}</div>
                <div className="sm:col-span-1"><textarea value={suggestHours} onChange={(e) => setSuggestHours(e.target.value)} placeholder="Hours (e.g. Mon–Fri 8–18)" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div className="font-medium text-gray-700 sm:col-span-1">Website</div>
                <div className="text-gray-700 sm:col-span-1">{formatCurrentDisplay(cafe.website)}</div>
                <div className="sm:col-span-1"><input type="url" value={suggestWebsite} onChange={(e) => setSuggestWebsite(e.target.value)} placeholder="Website URL" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div className="font-medium text-gray-700 sm:col-span-1">Noise level</div>
                <div className="text-gray-700 sm:col-span-1">{formatCurrentDisplay(cafe.ai_noise_level)}</div>
                <div className="sm:col-span-1"><select value={suggestNoiseLevel} onChange={(e) => setSuggestNoiseLevel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">{NOISE_LEVEL_OPTIONS.map((o) => <option key={o || '_'} value={o}>{o ? o : '(unchanged)'}</option>)}</select></div>
                <div className="font-medium text-gray-700 sm:col-span-1">Time limit</div>
                <div className="text-gray-700 sm:col-span-1">{formatCurrentDisplay(cafe.ai_laptop_policy)}</div>
                <div className="sm:col-span-1"><select value={suggestTimeLimit} onChange={(e) => setSuggestTimeLimit(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">{TIME_LIMIT_OPTIONS.map((o) => <option key={o || '_'} value={o}>{o ? o : '(unchanged)'}</option>)}</select></div>
                <div className="font-medium text-gray-700 sm:col-span-1">Laptop friendly</div>
                <div className="text-gray-700 sm:col-span-1">{formatCurrentDisplay(cafe.is_work_friendly)}</div>
                <div className="sm:col-span-1"><select value={suggestLaptopFriendly} onChange={(e) => setSuggestLaptopFriendly(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500">{LAPTOP_FRIENDLY_OPTIONS.map((o) => <option key={o || '_'} value={o}>{o === '' ? '(unchanged)' : o === 'true' ? 'Yes' : 'No'}</option>)}</select></div>
                <div className="font-medium text-gray-700 sm:col-span-1">WiFi quality</div>
                <div className="text-gray-700 sm:col-span-1">{formatCurrentDisplay(cafe.ai_wifi_quality)}</div>
                <div className="sm:col-span-1"><input type="text" value={suggestWifiQuality} onChange={(e) => setSuggestWifiQuality(e.target.value)} placeholder="WiFi quality" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div className="font-medium text-gray-700 sm:col-span-1">Power outlets</div>
                <div className="text-gray-700 sm:col-span-1">{formatCurrentDisplay(cafe.ai_power_outlets)}</div>
                <div className="sm:col-span-1"><input type="text" value={suggestPowerOutlets} onChange={(e) => setSuggestPowerOutlets(e.target.value)} placeholder="Power outlets" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
              </div>
              <label className="block mt-4 text-sm font-medium text-gray-700 mb-1">Evidence / comment (optional, not applied to listing)</label>
              <textarea value={suggestEvidence} onChange={(e) => setSuggestEvidence(e.target.value)} placeholder="Optional note for reviewers…" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              <label className="block mt-3 text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
              <input type="email" value={suggestEmail} onChange={(e) => setSuggestEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              {suggestMessage && (
                <p className={`mt-3 text-sm ${suggestMessage.startsWith('Thanks') ? 'text-green-700' : 'text-red-700'}`} role="status">{suggestMessage}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={handleSuggestSubmit} disabled={suggestSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50">
                  {suggestSubmitting ? 'Sending…' : 'Submit'}
                </button>
                <button type="button" onClick={() => { setSuggestOpen(false); setSuggestMessage(null) }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                  Cancel
                </button>
              </div>
            </section>
          )}

          {reviewOpen && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">✍️ Write a review / Report</h2>
              <p className="text-sm text-gray-600 mb-4">Choose type and add your feedback. Reviews are moderated before being shown.</p>
              <div className="flex gap-3 mb-4">
                {(['review', 'quick_feedback', 'report'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setReviewKind(k)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      reviewKind === k
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {k === 'review' ? 'Review' : k === 'quick_feedback' ? 'Quick feedback' : 'Report'}
                  </button>
                ))}
              </div>
              {reviewKind === 'review' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1–5, optional)</label>
                  <select
                    value={reviewRating === '' ? '' : String(reviewRating)}
                    onChange={(e) => setReviewRating(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full max-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {reviewKind === 'review' ? 'Your review (optional if you set a rating)' : 'Your message'}
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={reviewKind === 'review' ? 'How was working here?' : 'Describe the issue or feedback…'}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <label className="block mt-3 text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
              <input
                type="email"
                value={reviewEmail}
                onChange={(e) => setReviewEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {reviewMessage && (
                <p
                  className={`mt-3 text-sm ${reviewMessage.startsWith('Thanks') ? 'text-green-700' : 'text-red-700'}`}
                  role="status"
                >
                  {reviewMessage}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={reviewSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Sending…' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => { setReviewOpen(false); setReviewMessage(null) }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {/* 3) Map - Always render if location data exists */}
          {(cafe.latitude != null && cafe.longitude != null) || cafe.google_maps_url || cafe.address ? (
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">📍 {t(dict, 'cafeDetail.location')}</h2>
              </div>
              <div className="p-4">
                <CafeMapEmbed cafe={cafe} />
              </div>
            </section>
          ) : null}

          <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ {t(dict, 'cafeDetail.info')}</h2>
            {(
              cafe.google_rating != null ||
              cafe.google_ratings_total != null ||
              (cafe.price_level != null && cafe.price_level > 0) ||
              !!cafe.business_status ||
              !!cafe.phone ||
              !!(cafe.website || domain)
            ) ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                {(cafe.google_rating != null || cafe.google_ratings_total != null) && (
                  <div>
                    <dt className="text-sm text-gray-500">{t(dict, 'cafeDetail.rating')}</dt>
                    <dd className="font-medium text-gray-900">
                      {cafe.google_rating != null && (
                        <span className="text-yellow-600">⭐ {cafe.google_rating.toFixed(1)}</span>
                      )}
                      {cafe.google_ratings_total != null && (
                        <span className="text-gray-600 ml-1">
                          ({cafe.google_ratings_total.toLocaleString()} {t(dict, 'common.reviews')})
                        </span>
                      )}
                    </dd>
                  </div>
                )}
                {formatPriceLevel(cafe.price_level) && (
                  <div>
                    <dt className="text-sm text-gray-500">{t(dict, 'cafeDetail.price')}</dt>
                    <dd className="font-medium text-gray-900">
                      {formatPriceLevel(cafe.price_level)}
                    </dd>
                  </div>
                )}
                {cafe.business_status && (
                  <div>
                    <dt className="text-sm text-gray-500">{t(dict, 'cafeDetail.status')}</dt>
                    <dd className="font-medium text-gray-900 capitalize">
                      {(cafe.business_status ?? '').replace(/_/g, ' ')}
                    </dd>
                  </div>
                )}
                {cafe.phone && (
                  <div>
                    <dt className="text-sm text-gray-500">📞 Phone</dt>
                    <dd>
                      <a href={`tel:${cafe.phone}`} className="font-medium text-primary-600 hover:text-primary-700">
                        {cafe.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {cafe.website && domain && (
                  <div>
                    <dt className="text-sm text-gray-500">🌐 {t(dict, 'cafeDetail.websiteLabel')}</dt>
                    <dd>
                      <a
                        href={(cafe.website ?? '').startsWith('http') ? cafe.website! : `https://${cafe.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {domain}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-gray-500 text-sm">{t(dict, 'cafeDetail.noInfoYet')}</p>
            )}
          </section>

          <CafeHours hours={cafe.hours} lastChecked={lastChecked} google_maps_url={cafe.google_maps_url} />

          <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">💻 {t(dict, 'cafeDetail.sectionLaptopFriendly')}</h2>
            <div className="space-y-4">
              {formatWorkScore(cafe.work_score) && (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary-600">{formatWorkScore(cafe.work_score)}</span>
                  <span className="text-gray-600">{t(dict, 'cafeDetail.workScoreLabel')}</span>
                </div>
              )}
              {cafe.is_work_friendly != null && (
                <p className="font-medium text-gray-900">
                  {cafe.is_work_friendly ? `✅ ${t(dict, 'cafeDetail.workFriendly')}` : `⚠️ ${t(dict, 'cafeDetail.notIdealForWork')}`}
                </p>
              )}
              {(() => {
                const confidence = normalizeConfidence(cafe.ai_confidence)
                return confidence ? (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t(dict, 'cafeDetail.confidence')}</span> {confidence}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">{t(dict, 'cafeDetail.confidence')}</span> {t(dict, 'cafeDetail.notEnoughSignals')}
                  </p>
                )
              })()}
              {(() => {
                const wifi = normalizeUnknownToNotEnoughDataYet(cafe.ai_wifi_quality)
                const outlets = normalizeUnknownToNotEnoughDataYet(cafe.ai_power_outlets)
                const noise = normalizeUnknownToNotEnoughDataYet(cafe.ai_noise_level)
                const policy = normalizeUnknownToNotEnoughDataYet(cafe.ai_laptop_policy)
                if (wifi || outlets || noise || policy) {
                  return (
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {wifi ? (
                        <div>
                          <dt className="text-sm text-gray-500">📶 {t(dict, 'cafeDetail.wifi')}</dt>
                          <dd className="text-gray-900">{wifi}</dd>
                        </div>
                      ) : null}
                      {outlets ? (
                        <div>
                          <dt className="text-sm text-gray-500">🔌 {t(dict, 'cafeDetail.outlets')}</dt>
                          <dd className="text-gray-900">{outlets}</dd>
                        </div>
                      ) : null}
                      {noise ? (
                        <div>
                          <dt className="text-sm text-gray-500">🔊 {t(dict, 'cafeDetail.noise')}</dt>
                          <dd className="text-gray-900">{noise}</dd>
                        </div>
                      ) : null}
                      {policy ? (
                        <div>
                          <dt className="text-sm text-gray-500">💼 {t(dict, 'cafeDetail.laptopPolicy')}</dt>
                          <dd className="text-gray-900">{policy}</dd>
                        </div>
                      ) : null}
                    </dl>
                  )
                }
                return null
              })()}
              {!formatWorkScore(cafe.work_score) && cafe.is_work_friendly == null && !normalizeConfidence(cafe.ai_confidence) &&
               !normalizeUnknownToNotEnoughDataYet(cafe.ai_wifi_quality) && !normalizeUnknownToNotEnoughDataYet(cafe.ai_power_outlets) && 
               !normalizeUnknownToNotEnoughDataYet(cafe.ai_noise_level) && !normalizeUnknownToNotEnoughDataYet(cafe.ai_laptop_policy) && !hasWhy && (
                <p className="text-gray-500 text-sm">{t(dict, 'cafeDetail.insightsNotAvailable')}</p>
              )}
              {hasWhy && (
                <details className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
                  <summary className="px-4 py-3 bg-gray-50 font-medium text-gray-900 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset">
                    {t(dict, 'cafeDetail.whyScoutThinks')}
                  </summary>
                  <div className="px-4 py-3 bg-white border-t border-gray-200 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {whyContent}
                  </div>
                </details>
              )}
            </div>
          </section>

          <CafeFAQ cafe={cafe} />

          {/* Reviews (approved, kind=review, with review_text) */}
          <section className="mt-10 bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">{t(dict, 'common.reviews')}</h2>
            {!approvedReviews?.length ? (
              <p className="mt-2 text-sm text-gray-500">No reviews yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {approvedReviews.map((r) => (
                  <div key={r.id ?? r.created_at} className="rounded-xl border border-gray-200 p-4">
                    <div className="text-sm font-medium text-gray-700">
                      Rating: {r.rating != null ? r.rating : '—'}/5
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                      {r.review_text}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB') : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Explore more */}
          {(cafe.city || nearbyCafes.length > 0) && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t(dict, 'cafeDetail.exploreMore')}</h2>
              <div className="space-y-2">
                {cafe.city && (
                  <Link
                    href={prefixWithLocale(`/cities/${encodeURIComponent((cafe.city ?? '').toLowerCase())}`, locale)}
                    className="block text-primary-600 hover:text-primary-700 font-medium"
                  >
                    → {t(dict, 'cafeDetail.moreCafesIn')} {cafe.city}
                  </Link>
                )}
                {nearbyCafes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{t(dict, 'cafeDetail.nearby')}</p>
                    <ul className="space-y-1">
                      {nearbyCafes.map((n) => (
                        <li key={n.id}>
                          <Link
                            href={getCafeHref(n, locale)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {n.name}
                            {formatWorkScore(n.work_score) && (
                              <span className="text-gray-500 ml-1">({formatWorkScore(n.work_score)})</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  )
}
