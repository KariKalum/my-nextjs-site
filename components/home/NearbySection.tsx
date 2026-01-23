import Link from 'next/link'
import NearbyMapClient from '@/components/home/NearbyMapClient'
import Section from '@/components/Section'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { Locale } from '@/lib/i18n/config'
import { prefixWithLocale } from '@/lib/i18n/routing'

export default function NearbySection({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  return (
    <Section id="nearby-section" spacing="md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t(dict, 'home.nearby.title')}
            </h2>
            <p className="text-gray-600">
              {t(dict, 'home.nearby.subtitle')}
            </p>
          </div>
          <Link
            href={prefixWithLocale('/cities', locale)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {t(dict, 'home.nearby.browseAll')}
          </Link>
        </div>
      </div>

      <div className="w-full">
        <NearbyMapClient dict={dict} locale={locale} />
      </div>
    </Section>
  )
}
