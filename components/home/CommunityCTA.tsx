import Link from 'next/link'
import Section from '@/components/Section'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { Locale } from '@/lib/i18n/config'
import { prefixWithLocale } from '@/lib/i18n/routing'

export default function CommunityCTA({
  dict,
  locale,
}: {
  dict: Dictionary
  locale: Locale
}) {
  return (
    <Section backgroundColor="primary" spacing="md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t(dict, 'home.cta.title')}
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            {t(dict, 'home.cta.subtitle')}
          </p>
          <Link
            href={prefixWithLocale('/submit', locale)}
            className="inline-block px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 transition-colors"
          >
            {t(dict, 'home.cta.submitCafe')}
          </Link>
        </div>
      </div>
    </Section>
  )
}
