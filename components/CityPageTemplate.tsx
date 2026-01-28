/**
 * Reusable city page template component
 * Supports both city and district pages
 */

import Link from 'next/link'
import type { Cafe } from '@/src/lib/supabase/types'
import CommunityNotice from '@/components/CommunityNotice'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import CityCafeList from '@/components/CityCafeList'
import CityFAQ from '@/components/CityFAQ'
import SearchResults from '@/components/SearchResults'
import { prefixWithLocale } from '@/lib/i18n/routing'
import { t, tmpl } from '@/lib/i18n/t'
import type { CityPageConfig } from '@/lib/cities/types'
import { getAbsoluteUrl } from '@/lib/seo/metadata'

interface CityPageTemplateProps {
  cafes: Cafe[]
  config: CityPageConfig
}

export default function CityPageTemplate({ cafes, config }: CityPageTemplateProps) {
  // Runtime guard: ensure cafes is always an array
  const safeCafes = Array.isArray(cafes) ? cafes : []
  
  const {
    locale,
    citySlug,
    cityDisplayName,
    districtSlug,
    districtDisplayName,
    h1Title,
    introText,
    trustParagraph,
    faqItems,
    districtLinks,
    relatedLinks,
    otherCityLinks,
    showNicheSection,
    nicheSectionTitle,
    nicheSectionDescription,
    dict,
  } = config

  const displayName = districtDisplayName || cityDisplayName
  const pagePath = districtSlug
    ? `/cities/${citySlug}/${districtSlug}`
    : `/cities/${citySlug}`
  // Full path with locale for FAQ JSON-LD @id (ensures uniqueness across locales)
  const fullPagePath = `/${locale}${pagePath}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link
                href={prefixWithLocale('/', locale)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                {t(dict, 'city.home')}
              </Link>
              <span className="text-gray-400">•</span>
              <Link
                href={prefixWithLocale('/cities', locale)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                {t(dict, 'city.allCities')}
              </Link>
              {districtSlug && (
                <>
                  <span className="text-gray-400">•</span>
                  <Link
                    href={prefixWithLocale(`/cities/${citySlug}`, locale)}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    {cityDisplayName}
                  </Link>
                </>
              )}
            </div>
            <LanguageSwitcher />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{h1Title}</h1>
          <p className="mt-2 text-lg text-gray-600">
            {safeCafes.length} {safeCafes.length === 1 ? t(dict, 'common.cafeFound') : t(dict, 'common.cafesFound')}
          </p>
        </div>
      </header>

      <CommunityNotice dict={dict} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* SEO Intro Paragraph */}
        {introText && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">{introText}</p>
              {trustParagraph && (
                <p className="text-gray-700 leading-relaxed text-base md:text-lg mt-4">
                  {trustParagraph}
                </p>
              )}
            </div>
          </section>
        )}

        {/* District Links */}
        {districtLinks && districtLinks.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {t(dict, 'city.berlinDistricts')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {districtLinks.map((link) => (
                <Link
                  key={link.href}
                  href={prefixWithLocale(link.href, locale)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related links section */}
        {relatedLinks && relatedLinks.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {t(dict, 'city.related')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={prefixWithLocale(link.href, locale)}
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* What you'll find section */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t(dict, 'meta.city.whatYoullFind.title')}
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary-600 mt-1">•</span>
                <span className="text-gray-700">{t(dict, 'meta.city.whatYoullFind.item1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-600 mt-1">•</span>
                <span className="text-gray-700">{t(dict, 'meta.city.whatYoullFind.item2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-600 mt-1">•</span>
                <span className="text-gray-700">{t(dict, 'meta.city.whatYoullFind.item3')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-600 mt-1">•</span>
                <span className="text-gray-700">{t(dict, 'meta.city.whatYoullFind.item4')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-600 mt-1">•</span>
                <span className="text-gray-700">{t(dict, 'meta.city.whatYoullFind.item5')}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Optional niche section */}
        {showNicheSection && cafes.length >= 10 && nicheSectionTitle && nicheSectionDescription && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{nicheSectionTitle}</h2>
              <p className="text-gray-700 leading-relaxed">{nicheSectionDescription}</p>
            </div>
          </section>
        )}

        {/* Other cities section */}
        {otherCityLinks && otherCityLinks.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t(dict, 'city.exploreOtherCities')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherCityLinks.map((link) => (
                <Link
                  key={link.href}
                  href={prefixWithLocale(link.href, locale)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={prefixWithLocale('/cities', locale)}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
              >
                {t(dict, 'city.viewAllCities')}
              </Link>
            </div>
          </section>
        )}

        {/* Cafe List */}
        <SearchResults cafes={safeCafes} cityName={displayName} locale={locale} dict={dict}>
          <CityCafeList cafes={safeCafes} cityName={displayName} locale={locale} dict={dict} />
        </SearchResults>

        {/* Submit CTA Section */}
        <section className="mt-12">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 p-6 md:p-8 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              {t(dict, 'meta.submit.suggestCafe')}
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              {t(dict, 'meta.submit.suggestionHelpsOthers')}
            </p>
            <Link
              href={prefixWithLocale('/submit', locale)}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
            >
              {t(dict, 'common.submitCafe')}
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        {faqItems && faqItems.length > 0 && (
          <>
            <CityFAQWithItems faqItems={faqItems} cityName={displayName} dict={dict} />
            {/* FAQ Structured Data (JSON-LD) */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  '@id': getAbsoluteUrl(fullPagePath),
                  mainEntity: faqItems.map((faq, index) => ({
                    '@type': 'Question',
                    '@id': `${getAbsoluteUrl(fullPagePath)}#faq-${index + 1}`,
                    name: faq.question,
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: faq.answer,
                    },
                  })),
                }),
              }}
            />
          </>
        )}
      </main>
    </div>
  )
}

/**
 * FAQ component that accepts custom FAQ items
 */
function CityFAQWithItems({
  faqItems,
  cityName,
  dict,
}: {
  faqItems: Array<{ question: string; answer: string }>
  cityName: string
  dict: any
}) {
  return (
    <section className="mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-5">
          {t(dict, 'meta.city.faq.title')}
        </h2>
        <div className="space-y-3">
          {faqItems.map((faq, index) => (
            <details
              key={index}
              className="group rounded-lg border border-gray-200 bg-white overflow-hidden transition-colors hover:border-gray-300"
            >
              <summary className="px-4 py-3 bg-gray-50 font-medium text-gray-900 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex-1 text-left text-sm md:text-base">{faq.question}</span>
                  <span
                    className="text-gray-400 text-sm transition-transform duration-200 group-open:rotate-180 flex-shrink-0"
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </div>
              </summary>
              <div className="px-4 py-3 bg-white border-t border-gray-200 text-gray-700 text-sm leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
