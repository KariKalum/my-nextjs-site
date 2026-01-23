import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import type { Cafe } from '@/src/lib/supabase/types'
import CommunityNotice from '@/components/CommunityNotice'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import { prefixWithLocale } from '@/lib/i18n/routing'

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const { siteName, getAbsoluteUrl, getHreflangAlternates } = await import('@/lib/seo/metadata')
  return {
    title: tmpl(t(dict, 'meta.cities.title'), { siteName }),
    description: t(dict, 'meta.cities.description'),
    openGraph: {
      title: t(dict, 'meta.cities.ogTitle'),
      description: t(dict, 'meta.cities.ogDescription'),
      type: 'website',
      url: getAbsoluteUrl(`/${locale}/cities`),
      siteName,
    },
    ...getHreflangAlternates('/cities', locale),
  }
}

async function getCities(): Promise<Array<{ city: string; count: number }>> {
  try {
    // Create Supabase client (validated at module load)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cafes')
      .select('city')
      .or('is_active.is.null,is_active.eq.true')

    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error("No cities returned from Supabase")
    }

    // Count cafes per city
    const cityCounts = new Map<string, number>()
    data.forEach((cafe) => {
      if (cafe.city) {
        cityCounts.set(cafe.city, (cityCounts.get(cafe.city) || 0) + 1)
      }
    })

    return Array.from(cityCounts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.city.localeCompare(b.city)
      })
  } catch (error) {
    console.error("❌ Error fetching cities:", error)
    throw error // IMPORTANT: do NOT swallow during debugging
  }
}


export default async function CitiesIndexPage({
  params,
}: {
  params: { locale: Locale }
}) {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const cities = await getCities()

  // Major German cities for quick links (always show these 6)
  const majorCities = ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Leipzig']

  // Get counts for major cities
  const majorCitiesWithCounts = majorCities.map((city) => {
    const cityData = cities.find((c) => c.city === city)
    return {
      name: city,
      slug: city.toLowerCase(),
      count: cityData?.count || 0,
    }
  })

  // Get other cities (not in major list)
  const otherCities = cities.filter(
    (c) => !majorCities.includes(c.city)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={prefixWithLocale('/', locale)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm mb-2 inline-block"
              >
                {t(dict, 'common.backToDirectory')}
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {t(dict, 'cities.browseByCity')}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {t(dict, 'cities.findInCities')}
              </p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <CommunityNotice dict={dict} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {t(dict, 'cities.majorCities')}
            </h2>
            <p className="text-gray-600">
              {t(dict, 'cities.exploreMajor')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {majorCitiesWithCounts.map((city) => (
              <Link
                key={city.slug}
                href={prefixWithLocale(`/cities/${city.slug}`, locale)}
                className="bg-white rounded-lg p-6 text-center border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                  🏙️
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                  {city.name}
                </h3>
                <div className="text-sm text-gray-600">
                  {city.count} {city.count === 1 ? t(dict, 'common.cafe') : t(dict, 'common.cafes')}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {otherCities.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {t(dict, 'cities.allCities')}
              </h2>
              <p className="text-gray-600">
                {t(dict, 'cities.discoverAll')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherCities.map(({ city, count }) => (
                <Link
                  key={city}
                  href={prefixWithLocale(`/cities/${encodeURIComponent(city.toLowerCase())}`, locale)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-900 text-lg">{city}</span>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {count} {count === 1 ? t(dict, 'common.cafe') : t(dict, 'common.cafes')}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {cities.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {t(dict, 'cities.noCitiesFound')}
            </p>
            <Link
              href={prefixWithLocale('/submit', locale)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              {t(dict, 'common.submitCafe')}
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
