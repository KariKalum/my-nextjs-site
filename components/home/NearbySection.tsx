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
    <Section id="nearby-section" spacing="md" className="!pt-6 md:!pt-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-4 md:mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t(dict, 'home.nearby.title')}
          </h2>
          <p className="text-gray-600">
            {t(dict, 'home.nearby.subtitle')}
          </p>
        </div>
      </div>

      <div className="w-full">
        <NearbyMapClient dict={dict} locale={locale} />
      </div>
    </Section>
  )
}
