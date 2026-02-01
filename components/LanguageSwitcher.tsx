'use client'

import { usePathname, useRouter } from 'next/navigation'
import { getLocaleFromPathname } from '@/lib/i18n/routing'
import { switchLocale } from '@/lib/i18n/path'
import { type Locale } from '@/lib/i18n/config'

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const currentLocale = getLocaleFromPathname(pathname)

  const handleToggle = () => {
    const newLocale: Locale = currentLocale === 'en' ? 'de' : 'en'
    const newPath = switchLocale(pathname, newLocale)
    router.push(newPath)
  }

  const label = currentLocale === 'en' ? 'Deutsch' : 'English'
  const currentLabel = currentLocale === 'en' ? 'English' : 'Deutsch'

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="text-gray-500 hover:text-gray-700 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 rounded px-1.5 py-1 transition-colors"
      aria-label={`Current language: ${currentLabel}. Switch to ${label}`}
      title={`Switch to ${label}`}
    >
      <span className="md:hidden tabular-nums">{currentLocale.toUpperCase()}</span>
      <span className="hidden md:inline tabular-nums">EN ⇄ DE</span>
    </button>
  )
}
