/**
 * Reusable city page template component
 * Supports both city and district pages
 */

import Link from 'next/link'
import type { Cafe } from '@/src/lib/supabase/types'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import CityMapSection from '@/components/CityMapSection'
import CafeCard from '@/components/CafeCard'
import CityFAQ from '@/components/CityFAQ'
import { prefixWithLocale } from '@/lib/i18n/routing'
import { t, tmpl } from '@/lib/i18n/t'
import type { CityPageConfig } from '@/lib/cities/types'
import { getAbsoluteUrl } from '@/lib/seo/metadata'
import { buildCityPageItemList } from '@/lib/seo/item-list'

interface CityPageTemplateProps {
  cafes: Cafe[]
  config: CityPageConfig
  /** When filtered list is thin (< MIN_RESULTS_THIN), show this extra list with sectionTitle */
  extraCafes?: Cafe[]
  extraCafesSectionTitle?: string
}

export default function CityPageTemplate({ cafes, config, extraCafes, extraCafesSectionTitle }: CityPageTemplateProps) {
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
    districtSectionTitle,
    relatedLinks,
    otherCityLinks,
    showNicheSection,
    nicheSectionTitle,
    nicheSectionDescription,
    mapCenter,
    mapZoom,
    preserveRegionZoom,
    lastUpdated,
    extraSections,
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 mb-2 md:mb-3 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap min-w-0">
              <Link
                href={prefixWithLocale('/', locale)}
                className="text-primary-600 hover:text-primary-700 font-medium text-xs md:text-sm"
              >
                {t(dict, 'city.home')}
              </Link>
              <span className="text-gray-400" aria-hidden>›</span>
              <Link
                href={prefixWithLocale('/cities', locale)}
                className="text-primary-600 hover:text-primary-700 font-medium text-xs md:text-sm"
              >
                {t(dict, 'city.allCities')}
              </Link>
              {districtSlug && (
                <>
                  <span className="text-gray-400" aria-hidden>›</span>
                  <Link
                    href={prefixWithLocale(`/cities/${citySlug}`, locale)}
                    className="text-primary-600 hover:text-primary-700 font-medium text-xs md:text-sm"
                  >
                    {cityDisplayName}
                  </Link>
                </>
              )}
            </div>
            <LanguageSwitcher />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900">{h1Title}</h1>
          <p className="mt-1.5 md:mt-2 text-base md:text-lg text-gray-600">
            {safeCafes.length} {safeCafes.length === 1 ? t(dict, 'common.cafeFound') : t(dict, 'common.cafesFound')}
          </p>
          {lastUpdated && (
            <p className="mt-1 text-sm text-gray-500 font-medium italic">
              {locale === 'de' ? 'Zuletzt aktualisiert:' : 'Last Updated:'} {lastUpdated}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* SEO Intro Paragraph */}
        {introText && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">{introText}</p>
              {trustParagraph && (
                <p className="text-gray-700 leading-relaxed text-base md:text-lg mt-4">
                  {trustParagraph}
                </p>
              )}
            </div>
          </section>
        )}

        {/* District Links (same template for any city with districts) */}
        {districtLinks && districtLinks.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {districtSectionTitle ?? t(dict, 'city.berlinDistricts')}
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

        {/* Map and Cafe Cards */}
        <CityMapSection cafes={safeCafes} locale={locale} dict={dict} cityName={displayName} regionCenter={mapCenter} regionZoom={mapZoom} preserveRegionZoom={preserveRegionZoom} />

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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
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

        {/* Extra SEO Content Sections */}
        {extraSections && extraSections.map((section, idx) => (
          <section key={idx} className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
              <div className="text-gray-700 leading-relaxed text-base whitespace-pre-line">
                {section.content}
              </div>
            </div>
          </section>
        ))}

        {/* Optional niche section */}
        {showNicheSection && cafes.length >= 10 && nicheSectionTitle && nicheSectionDescription && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
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

        {/* Extra "More great cafés in {city}" section when main list is thin (intent pages) */}
        {extraCafes && extraCafes.length > 0 && extraCafesSectionTitle && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{extraCafesSectionTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {extraCafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} locale={locale} dict={dict} />
              ))}
            </div>
          </section>
        )}

        {/* Submit CTA Section */}
        <section className="mt-12">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 p-6 md:p-8 text-center">
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

        {/* ItemList Structured Data (JSON-LD) – cafes on this list page, capped at 50 */}
        {safeCafes.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(buildCityPageItemList(safeCafes, locale, getAbsoluteUrl(fullPagePath))),
            }}
          />
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
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
