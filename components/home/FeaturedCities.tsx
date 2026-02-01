import Link from 'next/link'
import Image from 'next/image'
import Section from '@/components/Section'
import { getTopCitiesWithImages } from '@/src/lib/cafes/cities'
import { prefixWithLocale } from '@/lib/i18n/routing'
import { type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'

/** Number of cities to show in 2 rows of 5 (10 total). Fetch more so "View more" can appear. */
const CITIES_PER_ROW = 5
const CITIES_INITIAL = CITIES_PER_ROW * 2
const CITIES_FETCH_LIMIT = 20

export default async function FeaturedCities({
  params,
  dict,
}: {
  params: { locale: Locale }
  dict: Dictionary
}) {
  const locale = params.locale
  const allCities = await getTopCitiesWithImages(CITIES_FETCH_LIMIT).catch(() => [])
  const displayCities = allCities.slice(0, CITIES_INITIAL)
  const hasMore = allCities.length > CITIES_INITIAL

  return (
    <>
      {displayCities.length > 0 && (
        <Section spacing="md">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {t(dict, 'home.featured.title')}
              </h2>
              <p className="text-gray-600">
                {t(dict, 'home.featured.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {displayCities.map((city) => (
                <Link
                  key={city.slug}
                  href={prefixWithLocale(`/cities/${city.slug}`, locale)}
                  className="bg-white rounded-lg p-3 md:p-6 text-center border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all group"
                >
                  <div className="relative w-full aspect-video mb-3 rounded overflow-hidden bg-gray-100">
                    <Image
                      src={city.imageUrl}
                      alt={city.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                    {city.name}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {city.cafeCount}{' '}
                    {city.cafeCount === 1
                      ? t(dict, 'home.featured.cafe')
                      : t(dict, 'home.featured.cafes')}
                  </div>
                </Link>
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 text-center">
                <Link
                  href={prefixWithLocale('/cities', locale)}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 hover:border-primary-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  {t(dict, 'home.featured.viewMore')}
                </Link>
              </div>
            )}
          </div>
        </Section>
      )}
    </>
  )
}
