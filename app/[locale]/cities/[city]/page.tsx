import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import type { Cafe } from '@/src/lib/supabase/types'
import CommunityNotice from '@/components/CommunityNotice'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import CafeCard from '@/components/CafeCard'
import SearchResults from '@/components/SearchResults'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import { prefixWithLocale } from '@/lib/i18n/routing'

const CITY_INTRO_KEYS: Record<string, string> = {
  berlin: 'meta.city.introBerlin',
  hamburg: 'meta.city.introHamburg',
  munich: 'meta.city.introMunich',
  cologne: 'meta.city.introCologne',
  frankfurt: 'meta.city.introFrankfurt',
  leipzig: 'meta.city.introLeipzig',
}

const majorCities = ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Leipzig']

async function getCafesByCity(cityName: string): Promise<Cafe[]> {
  try {
    // Create Supabase client (validated at module load)
    const supabase = await createClient()

    // Fetch all active cafes
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .or('is_active.is.null,is_active.eq.true')
      .order('work_score', { ascending: false, nullsFirst: false })

    if (error) throw error

    // Filter by city name (case-insensitive)
    const filtered = (data || []).filter((cafe) =>
      cafe.city?.toLowerCase() === cityName.toLowerCase()
    ) as Cafe[]

    return filtered
  } catch (error) {
    console.error('Error fetching cafes by city:', error)
    return []
  }
}

function getCityNameFromSlug(slug: string): string {
  // Map common slugs to proper city names
  const cityMap: Record<string, string> = {
    berlin: 'Berlin',
    hamburg: 'Hamburg',
    munich: 'Munich',
    cologne: 'Cologne',
    frankfurt: 'Frankfurt',
    leipzig: 'Leipzig',
  }

  const lowerSlug = slug.toLowerCase()
  if (cityMap[lowerSlug]) {
    return cityMap[lowerSlug]
  }

  // Fallback: Convert slug to proper city name
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function generateMetadata({
  params,
}: {
  params: { city: string; locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const cityName = getCityNameFromSlug(params.city)
  const cafes = await getCafesByCity(cityName)
  const count = cafes.length
  const { siteName, getAbsoluteUrl } = await import('@/lib/seo/metadata')

  const title = tmpl(t(dict, 'meta.city.title'), { city: cityName, siteName })
  const description =
    count > 0
      ? tmpl(t(dict, 'meta.city.descriptionWithCount'), { count: String(count), city: cityName })
      : tmpl(t(dict, 'meta.city.descriptionNoCount'), { city: cityName })
  const ogAlt = tmpl(t(dict, 'meta.city.ogAlt'), { city: cityName })
  const canonicalUrl = getAbsoluteUrl(`/${locale}/cities/${params.city}`)
  const ogImage = getAbsoluteUrl('/og-default.jpg')
  const { getHreflangAlternates } = await import('@/lib/seo/metadata')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName,
      images: [{ url: ogImage, alt: ogAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    ...getHreflangAlternates(`/cities/${params.city}`, locale),
  }
}

export default async function CityPage({
  params,
}: {
  params: { city: string; locale: Locale }
}) {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const cityName = getCityNameFromSlug(params.city)
  const cafes = await getCafesByCity(cityName)

  const cityKey = params.city.toLowerCase()
  const introKey = CITY_INTRO_KEYS[cityKey]
  const introText = introKey ? t(dict, introKey) : null

  // Get other major cities for internal links
  const otherCities = majorCities
    .filter((city) => city.toLowerCase() !== cityName.toLowerCase())
    .slice(0, 5) // Show top 5 other cities

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
            </div>
            <LanguageSwitcher />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {t(dict, 'city.laptopFriendlyIn')} {cityName}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {cafes.length} {cafes.length === 1 ? t(dict, 'common.cafeFound') : t(dict, 'common.cafesFound')}
          </p>
        </div>
      </header>

      <CommunityNotice dict={dict} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* SEO Intro Paragraph */}
        {introText && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                {introText}
              </p>
            </div>
          </section>
        )}

        {otherCities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t(dict, 'city.exploreOtherCities')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherCities.map((city) => (
                <Link
                  key={city}
                  href={prefixWithLocale(`/cities/${encodeURIComponent(city.toLowerCase())}`, locale)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {city}
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

        <SearchResults cafes={cafes} cityName={cityName} locale={locale} dict={dict}>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {cafes.length} {cafes.length === 1 ? t(dict, 'common.cafeFound') : t(dict, 'common.cafesFound')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} locale={locale} dict={dict} />
              ))}
            </div>
          </section>
        </SearchResults>
      </main>
    </div>
  )
}
