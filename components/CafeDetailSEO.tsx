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

interface CafeDetailSEOProps {
  cafe: Cafe
  nearbyCafes?: Cafe[]
  dict: Dictionary
  locale: Locale
}

export default function CafeDetailSEO({ cafe, nearbyCafes = [], dict, locale }: CafeDetailSEOProps) {
  const [toast, setToast] = useState<string | null>(null)

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
