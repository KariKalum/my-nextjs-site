'use client'

import { usePathname, useRouter } from 'next/navigation'
import { getLocaleFromPathname } from '@/lib/i18n/routing'
import { switchLocale } from '@/lib/i18n/path'
import { type Locale, locales } from '@/lib/i18n/config'

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const currentLocale = getLocaleFromPathname(pathname)
  
  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return
    
    const newPath = switchLocale(pathname, newLocale)
    router.push(newPath)
  }

  return (
    <div className="flex items-center gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentLocale === locale
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={`Switch to ${locale === 'en' ? 'English' : 'German'}`}
          aria-pressed={currentLocale === locale}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
