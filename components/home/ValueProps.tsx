'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Section from '@/components/Section'
import { getLocaleFromPathname, prefixWithLocale } from '@/lib/i18n/routing'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'

export default function ValueProps({ dict }: { dict: Dictionary }) {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)

  const props = [
    {
      icon: '📶',
      titleKey: 'home.valueProps.wifiTitle' as const,
      descKey: 'home.valueProps.wifiDesc' as const,
      href: prefixWithLocale('/find/wifi', locale),
    },
    {
      icon: '🔌',
      titleKey: 'home.valueProps.outletsTitle' as const,
      descKey: 'home.valueProps.outletsDesc' as const,
      href: prefixWithLocale('/find/outlets', locale),
    },
    {
      icon: '🔇',
      titleKey: 'home.valueProps.quietTitle' as const,
      descKey: 'home.valueProps.quietDesc' as const,
      href: prefixWithLocale('/find/quiet', locale),
    },
    {
      icon: '⏰',
      titleKey: 'home.valueProps.timeLimitTitle' as const,
      descKey: 'home.valueProps.timeLimitDesc' as const,
      href: prefixWithLocale('/find/time-limit', locale),
    },
  ]

  return (
    <Section spacing="md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t(dict, 'home.valueProps.title')}
          </h2>
          <p className="text-gray-600">
            {t(dict, 'home.valueProps.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {props.map((prop, index) => (
            <Link
              key={index}
              href={prop.href}
              className="text-center p-4 md:p-6 rounded-lg border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={`Find cafés with ${t(dict, prop.titleKey).toLowerCase()}`}
            >
              <div className="text-4xl mb-3 md:mb-4">{prop.icon}</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {t(dict, prop.titleKey)}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                {t(dict, prop.descKey)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  )
}
