import Link from 'next/link'
import { prefixWithLocale } from '@/lib/i18n/routing'
import { type Locale } from '@/lib/i18n/config'
import { t, tmpl } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'

interface SearchResultsProps {
  cafes: Array<{ id: string; name: string }>
  cityName?: string
  children: React.ReactNode
  locale: Locale
  dict: Dictionary
}

export default function SearchResults({ cafes, cityName, children, locale, dict }: SearchResultsProps) {
  // Runtime guard: ensure cafes is always an array
  const safeCafes = Array.isArray(cafes) ? cafes : []
  
  if (safeCafes.length === 0) {
    const emptyDesc = cityName
      ? tmpl(t(dict, 'searchResults.noCafesFoundInCity'), { city: cityName })
      : t(dict, 'searchResults.noCafesFoundTry')
    return (
      <section>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">☕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {t(dict, 'searchResults.noCafesFound')}
            </h2>
            <p className="text-gray-600 mb-6">
              {emptyDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={prefixWithLocale('/cities', locale)}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t(dict, 'common.browseAllCities')}
              </Link>
              <Link
                href={prefixWithLocale('/submit', locale)}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                {t(dict, 'common.submitCafe')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return <>{children}</>
}
